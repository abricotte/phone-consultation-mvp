-- ============================================================
-- 010 — ROLLBACK rendez-vous Calendly
-- ⚠️ Supprime la table ET tous les rendez-vous enregistrés.
-- Avant d'exécuter, vérifier ce qui serait perdu :
--   SELECT COUNT(*), MIN(debut), MAX(debut) FROM rendez_vous;
--
-- La colonne users.origine est CONSERVÉE : des fiches créées par
-- Calendly peuvent exister et la perdre les rendrait indistinguables
-- des inscriptions volontaires — donc réinscriptibles en doublon.
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_rdv_jour;
DROP INDEX IF EXISTS idx_rdv_client;
DROP INDEX IF EXISTS idx_rdv_chiffres;
DROP TABLE IF EXISTS rendez_vous;

COMMIT;
