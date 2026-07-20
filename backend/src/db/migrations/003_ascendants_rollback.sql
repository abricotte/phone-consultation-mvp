-- ============================================================
-- 003 — ROLLBACK des ascendants
-- ATTENTION : supprime les ascendants saisis par les clientes.
-- ============================================================

BEGIN;

ALTER TABLE users   DROP CONSTRAINT IF EXISTS users_ascendant_check;
ALTER TABLE proches DROP CONSTRAINT IF EXISTS proches_ascendant_check;

ALTER TABLE users   DROP COLUMN IF EXISTS ascendant;
ALTER TABLE proches DROP COLUMN IF EXISTS ascendant;

COMMIT;
