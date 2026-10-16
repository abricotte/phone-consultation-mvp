-- ============================================================
-- 020 — Vos questions, mes réponses (16 octobre 2026)
-- ============================================================
-- La boîte à idées du salon devient un échange : la cliente pose une
-- question ou soumet une idée ; Elena peut y répondre depuis son cabinet,
-- en quelques lignes. La réponse apparaît sous la question, dans l'espace
-- de la cliente seulement. Rien n'est envoyé : pas de mail, pas de
-- notification — elle la découvre en revenant au salon.
-- Additive et idempotente.
-- ============================================================

ALTER TABLE suggestions_clientes ADD COLUMN IF NOT EXISTS reponse TEXT;
ALTER TABLE suggestions_clientes ADD COLUMN IF NOT EXISTS repondu_le TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suggestions_reponse_longueur') THEN
    ALTER TABLE suggestions_clientes ADD CONSTRAINT suggestions_reponse_longueur
      CHECK (reponse IS NULL OR char_length(reponse) BETWEEN 1 AND 2000);
  END IF;
END $$;

-- Vérification : 2 lignes, reponse (text) et repondu_le (timestamp with time zone)
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'suggestions_clientes'
   AND column_name IN ('reponse', 'repondu_le')
 ORDER BY column_name;
