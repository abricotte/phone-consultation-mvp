-- ============================================================
-- 012 — ROLLBACK permanences
-- ⚠️ Supprime la table ET tous les créneaux posés.
-- Avant d'exécuter, vérifier ce qui serait perdu :
--   SELECT COUNT(*), MIN(debut), MAX(fin) FROM permanences;
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_permanences_debut;
DROP TABLE IF EXISTS permanences;

COMMIT;
