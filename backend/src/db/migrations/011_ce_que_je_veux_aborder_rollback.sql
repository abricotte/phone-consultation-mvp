-- ============================================================
-- 011 — ROLLBACK « Ce que je veux aborder »
-- ⚠️ Supprime les colonnes ET ce que les clientes y ont écrit.
-- Avant d'exécuter, mesurer ce qui serait perdu :
--   SELECT COUNT(*) FROM users WHERE a_aborder IS NOT NULL;
-- ============================================================

BEGIN;

ALTER TABLE users DROP COLUMN IF EXISTS a_aborder;
ALTER TABLE users DROP COLUMN IF EXISTS a_aborder_maj_le;

COMMIT;
