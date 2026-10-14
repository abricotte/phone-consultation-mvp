-- ============================================================
-- 016 — LES IDÉES DES CLIENTES (boîte à idées du salon)
-- Migration ADDITIVE et IDEMPOTENTE. Aucun DROP.
-- Rollback : 016_suggestions_clientes_rollback.sql
--
-- Dans le salon, sous les boosts, la cliente peut souffler un thème ou
-- une idée à Elena (« un boost sur… »). Elena les lit au cabinet, dans
-- l'onglet Commandes ; elle coche « lue » quand c'est vu. Rien n'est
-- envoyé à personne — pas de mail, pas de notification. Une idée n'est
-- jamais effacée par le système : c'est la mémoire de ce que ses
-- clientes attendent d'elle.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS suggestions_clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- à quoi sert l'idée : 'boost' pour l'instant (d'autres sujets pourront venir)
  sujet       TEXT NOT NULL DEFAULT 'boost' CHECK (sujet IN ('boost')),
  texte       TEXT NOT NULL CHECK (char_length(texte) BETWEEN 1 AND 600),
  lue         BOOLEAN NOT NULL DEFAULT FALSE,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Le cabinet : les idées non lues d'abord, puis par date
CREATE INDEX IF NOT EXISTS idx_suggestions_clientes_lue
  ON suggestions_clientes (lue, cree_le DESC);
-- L'espace : mes idées
CREATE INDEX IF NOT EXISTS idx_suggestions_clientes_client
  ON suggestions_clientes (client_id, cree_le DESC);

ALTER TABLE suggestions_clientes ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION — doit renvoyer 1
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'suggestions_clientes';
