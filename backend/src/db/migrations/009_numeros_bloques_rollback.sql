-- ============================================================
-- 009 — ROLLBACK numéros bloqués
-- ⚠️ Supprime la table ET la liste des numéros bloqués qu'elle contient.
-- Avant d'exécuter, vérifier ce qui serait perdu :
--   SELECT telephone, motif, bloque_le FROM numeros_bloques;
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_numeros_bloques_chiffres;
DROP TABLE IF EXISTS numeros_bloques;

COMMIT;
