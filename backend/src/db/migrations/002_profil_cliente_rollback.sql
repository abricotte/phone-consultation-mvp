-- ============================================================
-- 002 — ROLLBACK du profil cliente
-- Retire la table proches et la colonne date_naissance.
-- ATTENTION : supprime les données de profil saisies par les
-- clientes (dates de naissance + proches). Sauvegarder avant.
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS proches;

ALTER TABLE users DROP COLUMN IF EXISTS date_naissance;

COMMIT;
