-- ============================================================
-- 018 — Le portefeuille bouge en une seule fois (16 octobre 2026)
-- ============================================================
-- Deux défauts corrigés :
--
-- 1. RECHARGE CRÉDITÉE DEUX FOIS. Quand Stripe n'a pas sa réponse à
--    temps, il renvoie l'avis de paiement. Le serveur ajoutait l'argent
--    au solde AVANT d'écrire la ligne de transaction (protégée par
--    l'index unique idx_transactions_stripe_credit_unique) : au second
--    envoi, le solde était crédité une deuxième fois, et seule la ligne
--    était refusée.
--    → crediter_recharge() écrit d'abord la ligne ; si le paiement est
--      déjà connu, elle ne touche pas au solde.
--
-- 2. DEUX MOUVEMENTS EN MÊME TEMPS, UN QUI SE PERD. Le serveur lisait le
--    solde, calculait, puis réécrivait : une recharge arrivée pendant la
--    fin d'un appel pouvait s'effacer.
--    → les deux fonctions font l'addition / la soustraction dans la base,
--      ligne verrouillée, en une seule transaction.
--
-- Additive et idempotente : CREATE OR REPLACE, aucune donnée modifiée.
-- Réservée au serveur (clé de service) : ni anon ni authenticated ne
-- peuvent les appeler.
-- ============================================================

-- Recharge Stripe : crédite UNE fois par paiement.
-- Renvoie le nouveau solde, ou NULL si ce paiement était déjà crédité.
CREATE OR REPLACE FUNCTION public.crediter_recharge(
  p_wallet_id UUID,
  p_montant NUMERIC,
  p_stripe_payment_id TEXT,
  p_description TEXT
) RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_solde NUMERIC;
BEGIN
  IF p_montant IS NULL OR p_montant <= 0 THEN
    RAISE EXCEPTION 'crediter_recharge : montant invalide (%)', p_montant;
  END IF;
  IF p_stripe_payment_id IS NULL OR p_stripe_payment_id = '' THEN
    RAISE EXCEPTION 'crediter_recharge : paiement sans identifiant Stripe';
  END IF;

  -- La ligne d'abord : l'index unique décide si ce paiement est nouveau
  INSERT INTO transactions (wallet_id, type, amount, description, stripe_payment_id)
  VALUES (p_wallet_id, 'credit', p_montant, p_description, p_stripe_payment_id)
  ON CONFLICT (stripe_payment_id) WHERE stripe_payment_id IS NOT NULL AND type = 'credit'
  DO NOTHING;

  IF NOT FOUND THEN
    RETURN NULL; -- déjà crédité : on ne touche pas au solde
  END IF;

  UPDATE wallets
     SET balance = balance + p_montant, updated_at = NOW()
   WHERE id = p_wallet_id
  RETURNING balance INTO v_solde;

  IF v_solde IS NULL THEN
    -- l'exception annule aussi la ligne insérée ci-dessus
    RAISE EXCEPTION 'crediter_recharge : portefeuille introuvable (%)', p_wallet_id;
  END IF;

  RETURN v_solde;
END;
$$;

-- Fin d'une consultation à la minute : débite UNE fois par session.
-- Renvoie le nouveau solde, ou NULL si cette session était déjà débitée.
CREATE OR REPLACE FUNCTION public.debiter_consultation(
  p_wallet_id UUID,
  p_montant NUMERIC,
  p_session_id UUID,
  p_description TEXT
) RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_solde NUMERIC;
BEGIN
  IF p_montant IS NULL OR p_montant <= 0 THEN
    RAISE EXCEPTION 'debiter_consultation : montant invalide (%)', p_montant;
  END IF;

  -- Verrouille le portefeuille : tous les mouvements de cette cliente
  -- passent l'un après l'autre
  PERFORM 1 FROM wallets WHERE id = p_wallet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'debiter_consultation : portefeuille introuvable (%)', p_wallet_id;
  END IF;

  -- Seconde ceinture, en plus de la prise atomique de la session
  IF p_session_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM transactions WHERE session_id = p_session_id AND type = 'debit'
  ) THEN
    RETURN NULL;
  END IF;

  UPDATE wallets
     SET balance = GREATEST(0, balance - p_montant), updated_at = NOW()
   WHERE id = p_wallet_id
  RETURNING balance INTO v_solde;

  INSERT INTO transactions (wallet_id, type, amount, description, session_id)
  VALUES (p_wallet_id, 'debit', p_montant, p_description, p_session_id);

  RETURN v_solde;
END;
$$;

-- Réservées au serveur
REVOKE ALL ON FUNCTION public.crediter_recharge(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.debiter_consultation(UUID, NUMERIC, UUID, TEXT) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.crediter_recharge(UUID, NUMERIC, TEXT, TEXT) FROM anon;
    REVOKE ALL ON FUNCTION public.debiter_consultation(UUID, NUMERIC, UUID, TEXT) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION public.crediter_recharge(UUID, NUMERIC, TEXT, TEXT) FROM authenticated;
    REVOKE ALL ON FUNCTION public.debiter_consultation(UUID, NUMERIC, UUID, TEXT) FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.crediter_recharge(UUID, NUMERIC, TEXT, TEXT) TO service_role;
    GRANT EXECUTE ON FUNCTION public.debiter_consultation(UUID, NUMERIC, UUID, TEXT) TO service_role;
  END IF;
END $$;

-- Vérification : 2 lignes, « public_peut » et « cliente_peut » à false,
-- « serveur_peut » à true
SELECT p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS public_peut,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS cliente_peut,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS serveur_peut
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('crediter_recharge', 'debiter_consultation')
 ORDER BY p.proname;
