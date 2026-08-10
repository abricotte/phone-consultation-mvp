-- ============================================================
-- 004 — CARNET DE NOTES DE LA PRATICIENNE
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Rollback : 004_carnet_praticienne_rollback.sql
--
-- Notes privées d'Elena sur ses clientes : ce qu'elle veut retenir
-- d'une séance à l'autre, et les annonces datées à revoir plus tard
-- ("un changement vers octobre" → échéance octobre, à suivre).
--
-- CONFIDENTIALITÉ ABSOLUE : ces notes appartiennent à la praticienne.
-- Elles ne sont JAMAIS exposées à la cliente — aucune route de
-- l'espace cliente ne lit cette table, et RLS refuse tout accès direct.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS notes_praticienne (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  praticienne_id UUID NOT NULL REFERENCES praticiennes(id) ON DELETE CASCADE
    DEFAULT 'e1e0a000-0000-4000-8000-000000000001',
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Consultation à laquelle la note se rattache (facultatif : on peut
  -- noter à froid, hors séance)
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  contenu TEXT NOT NULL,
  -- Annonce datée à revoir ("un changement vers octobre")
  a_suivre BOOLEAN NOT NULL DEFAULT false,
  echeance DATE,
  -- Marquée comme advenue / traitée
  close_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_client ON notes_praticienne(client_id, created_at DESC);
-- Les suivis ouverts, triés par échéance : la liste "à revoir"
CREATE INDEX IF NOT EXISTS idx_notes_a_suivre
  ON notes_praticienne(praticienne_id, echeance)
  WHERE a_suivre = true AND close_le IS NULL;

-- Création conditionnelle du déclencheur, SANS "DROP" : le script reste
-- rejouable sans déclencher l'avertissement « opération destructive »
-- de l'éditeur SQL Supabase.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'notes_praticienne_updated_at'
       AND tgrelid = 'notes_praticienne'::regclass
  ) THEN
    CREATE TRIGGER notes_praticienne_updated_at BEFORE UPDATE ON notes_praticienne
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- RLS deny-all : le backend passe en service role, aucun accès direct
ALTER TABLE notes_praticienne ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION : doit renvoyer 1
SELECT COUNT(*) AS table_notes_praticienne
  FROM information_schema.tables
 WHERE table_name = 'notes_praticienne';
