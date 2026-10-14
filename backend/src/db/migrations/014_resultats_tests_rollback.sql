-- ============================================================
-- 014 — ROLLBACK les résultats des tests spirituels
-- ⚠️ Supprime la table ET tous les résultats gardés par les clientes.
-- Avant d'exécuter :  SELECT client_id, test, titre_profil, cree_le FROM resultats_tests;
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_resultats_tests_client;
DROP TABLE IF EXISTS resultats_tests;

COMMIT;
