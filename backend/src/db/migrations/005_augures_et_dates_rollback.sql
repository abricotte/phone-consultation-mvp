-- ============================================================
-- 005 — ROLLBACK augures & dates qui pèsent
-- ATTENTION : supprime les dates marquantes confiées par les
-- clientes et le cycle de vie des augures. Sauvegarder avant.
-- Les notes elles-mêmes sont conservées (seules les colonnes
-- ajoutées disparaissent).
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS dates_marquantes;

ALTER TABLE notes_praticienne DROP CONSTRAINT IF EXISTS notes_type_check;
ALTER TABLE notes_praticienne DROP CONSTRAINT IF EXISTS notes_statut_check;

DROP INDEX IF EXISTS idx_notes_augures_ouverts;

ALTER TABLE notes_praticienne DROP COLUMN IF EXISTS type;
ALTER TABLE notes_praticienne DROP COLUMN IF EXISTS echeance_texte;
ALTER TABLE notes_praticienne DROP COLUMN IF EXISTS statut;

COMMIT;
