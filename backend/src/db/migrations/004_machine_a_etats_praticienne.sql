-- ============================================================
-- 004 — MACHINE À ÉTATS PRATICIENNE (3 états) + FORFAIT MANUEL
-- statut ∈ {hors_ligne, disponible, en_consultation}
-- (rdv_imminent et politique d'appels manqués : backlog V2)
--
-- Idempotente et additive. L'ancien booléen statut_en_ligne est
-- CONSERVÉ (synchronisé par le backend) et sera supprimé plus tard.
-- ============================================================

BEGIN;

-- 1. Colonnes de la machine à états
ALTER TABLE praticiennes ADD COLUMN IF NOT EXISTS statut VARCHAR(20) NOT NULL DEFAULT 'hors_ligne';
ALTER TABLE praticiennes ADD COLUMN IF NOT EXISTS statut_precedent VARCHAR(20) NOT NULL DEFAULT 'hors_ligne';
ALTER TABLE praticiennes ADD COLUMN IF NOT EXISTS retour_prevu TIMESTAMPTZ;  -- fin estimée de la consultation en cours

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'praticiennes_statut_check') THEN
    ALTER TABLE praticiennes ADD CONSTRAINT praticiennes_statut_check
      CHECK (statut IN ('hors_ligne', 'disponible', 'en_consultation'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'praticiennes_statut_precedent_check') THEN
    ALTER TABLE praticiennes ADD CONSTRAINT praticiennes_statut_precedent_check
      CHECK (statut_precedent IN ('hors_ligne', 'disponible', 'en_consultation'));
  END IF;
END $$;

-- 2. Backfill depuis l'ancien booléen (une seule fois)
UPDATE praticiennes
SET statut = 'disponible'
WHERE statut = 'hors_ligne' AND statut_en_ligne = true;

-- 3. SESSIONS : consultation minutée lancée depuis l'admin
--    (paiement déjà encaissé via Calendly → pas de compte cliente requis)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_type_check') THEN
    ALTER TABLE sessions DROP CONSTRAINT sessions_type_check;
  END IF;
  ALTER TABLE sessions ADD CONSTRAINT sessions_type_check
    CHECK (type IN ('minute', 'forfait', 'forfait_manuel'));
END $$;

-- La cliente d'un forfait manuel n'a pas forcément de compte
ALTER TABLE sessions ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS telephone_cliente VARCHAR(30);  -- donnée perso — purgée après 30 j (config)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cliente_call_sid VARCHAR(255);  -- garde anti-double-appel de la cliente

-- Rétention du numéro cliente : 30 jours (purge paresseuse côté backend)
UPDATE praticiennes
SET config_tarifs = config_tarifs || '{"retention_telephone_jours": 30}'::jsonb
WHERE slug = 'elena-wolska' AND NOT (config_tarifs ? 'retention_telephone_jours');

-- 4. Vue publique : expose le statut (3 états)
--    (security_invoker conservé ; GRANTs par colonne étendus — cumulatifs)
DROP VIEW IF EXISTS praticiennes_public;
CREATE VIEW praticiennes_public
  WITH (security_invoker = on) AS
  SELECT id, nom_public, slug, statut_en_ligne, statut, config_branding
  FROM praticiennes;

GRANT SELECT (id, nom_public, slug, statut_en_ligne, statut, config_branding)
  ON praticiennes TO anon, authenticated;
GRANT SELECT ON praticiennes_public TO anon, authenticated;

COMMIT;

-- Vérification : statut visible et cohérent avec l'ancien booléen
SELECT nom_public, statut, statut_precedent, statut_en_ligne FROM praticiennes;
