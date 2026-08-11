-- ============================================================
-- 009 — NUMÉROS BLOQUÉS
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Aucun DROP : l'éditeur Supabase ne signalera rien.
-- Rollback : 009_numeros_bloques_rollback.sql
--
-- Dix-neuf ans de métier : l'appelant irrespectueux, celui de 2 h du
-- matin, le harceleur. Cet outil se construit à froid — le jour où il
-- sert, on le veut immédiatement, pas dans trois semaines.
--
-- Le numéro est stocké NORMALISÉ (+33…) par utils/telephone.js, sans
-- quoi le même harceleur passerait au travers en composant 06… puis
-- 0033… La colonne `chiffres` sert de filet supplémentaire : elle
-- compare les seuls chiffres, indépendamment du format.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS numeros_bloques (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telephone   VARCHAR(20)  NOT NULL,
  -- Chiffres seuls, pour rattraper toute variation de format
  chiffres    VARCHAR(20)  NOT NULL,
  -- Motif libre, pour SA mémoire à elle. Jamais montré à personne.
  motif       TEXT,
  bloque_le   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (chiffres)
);

CREATE INDEX IF NOT EXISTS idx_numeros_bloques_chiffres
  ON numeros_bloques (chiffres);

-- Comme toutes les tables du cabinet : refus par défaut. Le backend y
-- accède avec la clé de service, qui contourne RLS ; aucune requête
-- venue du navigateur ne peut lire cette table.
ALTER TABLE numeros_bloques ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION — doit renvoyer 1
SELECT COUNT(*) AS table_creee
  FROM information_schema.tables
 WHERE table_name = 'numeros_bloques';
