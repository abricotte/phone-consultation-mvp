-- ============================================================
-- 013 — ROLLBACK le mot d'Elena
-- ⚠️ Supprime la table ET l'historique des mots publiés.
-- Avant d'exécuter :  SELECT texte, publie_le FROM mot_elena;
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_mot_elena_actif;
DROP TABLE IF EXISTS mot_elena;

COMMIT;
