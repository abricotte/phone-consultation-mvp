-- ============================================================
-- 014 — LES RÉSULTATS DES TESTS SPIRITUELS
-- Migration ADDITIVE et IDEMPOTENTE. Aucun DROP.
-- Rollback : 014_resultats_tests_rollback.sql
--
-- Quinze tests écrits par Elena, faits dans l'espace. On garde le
-- minimum : quel test, quel profil obtenu (sa clé et son nom tel
-- qu'affiché), le score s'il y en a un, la date. JAMAIS les réponses
-- une à une. Chaque passage est une ligne : refaire un test n'efface
-- pas le précédent — six mois plus tard, la suite raconte un chemin.
-- La cliente peut effacer une ligne ; Elena les voit dans la fiche de
-- la cliente (c'est dit sous chaque test). Rien n'est partagé ailleurs.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS resultats_tests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- l'identifiant du test dans le catalogue (frontend/lib/tests/index.ts)
  test          TEXT NOT NULL CHECK (char_length(test) BETWEEN 1 AND 60),
  -- la clé du profil (une lettre, ou le palier de score) et son nom affiché
  profil        TEXT NOT NULL CHECK (char_length(profil) BETWEEN 1 AND 60),
  titre_profil  TEXT NOT NULL CHECK (char_length(titre_profil) BETWEEN 1 AND 120),
  score         INTEGER,
  cree_le       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- « Mes résultats » : les lignes d'une cliente, les plus récentes d'abord
CREATE INDEX IF NOT EXISTS idx_resultats_tests_client
  ON resultats_tests (client_id, cree_le DESC);

-- Refus par défaut, comme toutes les tables : le backend lit et écrit
-- avec la clé de service après vérification du jeton.
ALTER TABLE resultats_tests ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION — doit renvoyer 1
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'resultats_tests';
