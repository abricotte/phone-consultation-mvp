-- ============================================================
-- 005 — AUGURES & DATES QUI PÈSENT
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Rollback : 005_augures_et_dates_rollback.sql
--
-- Deux mémoires distinctes, toutes deux STRICTEMENT PRIVÉES :
--   • ce que la praticienne a ANNONCÉ (augures) — avec échéance
--     souple ("vers octobre") et statut (attente/confirmé/pas encore)
--   • les DATES QUI PÈSENT que la cliente lui a confiées (deuil,
--     séparation, procès…), éventuellement récurrentes chaque année
--
-- Aucune route de l'espace cliente ne lit ces données. Elles servent
-- la mémoire de la praticienne, jamais une relance automatique.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Les augures réutilisent la table du carnet : une annonce EST
--    une note, avec un cycle de vie propre. Les notes « à suivre »
--    déjà saisies deviennent naturellement des augures.
-- ------------------------------------------------------------
ALTER TABLE notes_praticienne
  ADD COLUMN IF NOT EXISTS type VARCHAR(10) NOT NULL DEFAULT 'note';

-- Échéance en toutes lettres : "vers octobre", "avant la fin de
-- l'année" — la précision d'une date n'a pas toujours de sens.
ALTER TABLE notes_praticienne
  ADD COLUMN IF NOT EXISTS echeance_texte VARCHAR(120);

-- attente : on attend de voir · confirme : c'est arrivé
-- pas_encore : l'échéance est passée sans que cela advienne
ALTER TABLE notes_praticienne
  ADD COLUMN IF NOT EXISTS statut VARCHAR(15);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notes_type_check') THEN
    ALTER TABLE notes_praticienne ADD CONSTRAINT notes_type_check
      CHECK (type IN ('note', 'augure'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notes_statut_check') THEN
    ALTER TABLE notes_praticienne ADD CONSTRAINT notes_statut_check
      CHECK (statut IS NULL OR statut IN ('attente', 'confirme', 'pas_encore'));
  END IF;
END $$;

-- Reprise : les notes marquées « à suivre » sont des augures en attente
UPDATE notes_praticienne
   SET type = 'augure',
       statut = COALESCE(statut, CASE WHEN close_le IS NULL THEN 'attente' ELSE 'confirme' END)
 WHERE a_suivre = true AND type = 'note';

-- Les augures ouverts, par échéance : la vue « À reprendre »
CREATE INDEX IF NOT EXISTS idx_notes_augures_ouverts
  ON notes_praticienne(praticienne_id, echeance)
  WHERE type = 'augure' AND statut = 'attente';

-- ------------------------------------------------------------
-- 2. DATES QUI PÈSENT — confiées en consultation, à ne pas oublier
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dates_marquantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  praticienne_id UUID NOT NULL REFERENCES praticiennes(id) ON DELETE CASCADE
    DEFAULT 'e1e0a000-0000-4000-8000-000000000001',
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  libelle VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  -- Un deuil revient chaque année ; un procès a lieu une seule fois
  recurrence_annuelle BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dates_marquantes_client
  ON dates_marquantes(client_id, date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'dates_marquantes_updated_at'
       AND tgrelid = 'dates_marquantes'::regclass
  ) THEN
    CREATE TRIGGER dates_marquantes_updated_at BEFORE UPDATE ON dates_marquantes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE dates_marquantes ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATIONS — les trois lignes doivent valoir 1
SELECT 'notes.type' AS objet, COUNT(*) FROM information_schema.columns
 WHERE table_name = 'notes_praticienne' AND column_name = 'type'
UNION ALL
SELECT 'notes.statut', COUNT(*) FROM information_schema.columns
 WHERE table_name = 'notes_praticienne' AND column_name = 'statut'
UNION ALL
SELECT 'table dates_marquantes', COUNT(*) FROM information_schema.tables
 WHERE table_name = 'dates_marquantes';
