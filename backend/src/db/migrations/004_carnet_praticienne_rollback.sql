-- ============================================================
-- 004 — ROLLBACK du carnet de notes
-- ATTENTION : supprime définitivement toutes les notes privées
-- de la praticienne. Sauvegarder avant si elles ont de la valeur.
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS notes_praticienne;

COMMIT;
