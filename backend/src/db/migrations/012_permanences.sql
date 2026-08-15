-- ============================================================
-- 012 — PERMANENCES
-- Migration ADDITIVE et IDEMPOTENTE. Aucun DROP.
-- Rollback : 012_permanences_rollback.sql
--
-- Principe posé par Elena, et qui gouverne tout le reste :
-- « LE CALENDRIER ANNONCE, LE BOUTON FAIT FOI. »
-- Ces créneaux n'ouvrent JAMAIS les appels — seule la bascule
-- « en ligne » le fait. Ils servent uniquement d'écriteaux : le site
-- et l'espace cliente annoncent quand revenir.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS permanences (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  praticienne_id UUID NOT NULL REFERENCES praticiennes(id)
                 DEFAULT 'e1e0a000-0000-4000-8000-000000000001',
  debut          TIMESTAMPTZ NOT NULL,
  fin            TIMESTAMPTZ NOT NULL,
  cree_le        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (fin > debut)
);

-- « Quelle est la permanence en cours / la prochaine ? » — la seule
-- question que le site pose, plusieurs fois par minute.
CREATE INDEX IF NOT EXISTS idx_permanences_debut ON permanences (debut);

-- Comme toutes les tables du cabinet : refus par défaut, accès par la
-- clé de service uniquement.
ALTER TABLE permanences ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION — doit renvoyer 1
SELECT COUNT(*) AS table_creee
  FROM information_schema.tables
 WHERE table_name = 'permanences';
