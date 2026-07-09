-- ============================================================
-- 002 — PROFIL CLIENTE : date de naissance + "personnes qui comptent"
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Rollback : 002_profil_cliente_rollback.sql
--
-- Toutes ces données sont OPTIONNELLES (jamais requises pour consulter)
-- et strictement privées : visibles uniquement par la cliente et par
-- Elena (via le backend en service role). RLS deny-all comme le reste.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Date de naissance de la cliente (facultative)
--    Sert à la lecture + au futur cadeau d'anniversaire (fidélité).
--    Le signe astrologique est CALCULÉ à l'affichage, pas stocké.
-- ------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_naissance DATE;

-- ------------------------------------------------------------
-- 2. "Les personnes qui comptent" — proches de la cliente
--    Usage strictement privé de préparation de consultation.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE,                       -- facultative
  lien VARCHAR(20) NOT NULL CHECK (
    lien IN ('compagnon', 'ex', 'mere', 'pere', 'enfant', 'ami', 'autre')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proches_client ON proches(client_id);

DROP TRIGGER IF EXISTS proches_updated_at ON proches;
CREATE TRIGGER proches_updated_at BEFORE UPDATE ON proches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- 3. RLS — verrouillage (backend en service role = bypass).
--    Aucune policy = aucun accès direct anon/authenticated.
-- ------------------------------------------------------------
ALTER TABLE proches ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ------------------------------------------------------------
-- VÉRIFICATIONS POST-MIGRATION
-- ------------------------------------------------------------
SELECT 'users.date_naissance' AS objet,
       COUNT(*) FILTER (WHERE column_name = 'date_naissance') AS present
  FROM information_schema.columns
 WHERE table_name = 'users'
UNION ALL
SELECT 'table proches',
       COUNT(*) FROM information_schema.tables WHERE table_name = 'proches';
-- Attendu : les deux lignes à 1
