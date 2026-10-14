-- ============================================================
-- 015 — LES COMMANDES DE TIRAGES
-- Migration ADDITIVE et IDEMPOTENTE. Aucun DROP.
-- Rollback : 015_commandes_tirages_rollback.sql
--
-- « Je commande mon tirage » (la Petite Pythie, le Grand Tableau) : la
-- cliente dépose sa commande et sa question depuis son espace ; Elena la
-- voit dans l'onglet Commandes du cabinet, la fait, la marque livrée.
-- Le paiement en ligne viendra (Stripe) : d'ici là `paye` est coché par
-- Elena quand c'est réglé autrement. Une commande n'est jamais effacée :
-- `annulee` est un statut. Rien n'est envoyé à personne — pas de mail,
-- pas de notification : l'espace s'illumine.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS commandes_tirages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- le tirage commandé : 'pythie' (3 cartes) ou 'grand_tableau' (36 cartes + audio)
  type        TEXT NOT NULL CHECK (type IN ('pythie', 'grand_tableau')),
  -- la question de la cliente, telle qu'elle l'écrit (facultative pour le Grand Tableau)
  question    TEXT CHECK (question IS NULL OR char_length(question) <= 2000),
  statut      TEXT NOT NULL DEFAULT 'recue' CHECK (statut IN ('recue', 'en_cours', 'livree', 'annulee')),
  -- le prix au moment de la commande, en euros ; réglé ou pas
  montant     NUMERIC(8,2) NOT NULL CHECK (montant >= 0),
  paye        BOOLEAN NOT NULL DEFAULT FALSE,
  -- le mot d'Elena pour elle-même (jamais montré à la cliente)
  note_elena  TEXT CHECK (note_elena IS NULL OR char_length(note_elena) <= 2000),
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  livre_le    TIMESTAMPTZ
);

-- Le cabinet : les commandes à faire, les plus anciennes d'abord
CREATE INDEX IF NOT EXISTS idx_commandes_tirages_statut
  ON commandes_tirages (statut, cree_le);
-- L'espace : mes commandes
CREATE INDEX IF NOT EXISTS idx_commandes_tirages_client
  ON commandes_tirages (client_id, cree_le DESC);

ALTER TABLE commandes_tirages ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION — doit renvoyer 1
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'commandes_tirages';
