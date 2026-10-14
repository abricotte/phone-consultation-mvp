-- ============================================================
-- 017 — ROLLBACK l'heure et le lieu de naissance
-- ⚠️ Efface l'heure, le lieu et les coordonnées de naissance de toutes les clientes.
-- Avant d'exécuter :  SELECT id, heure_naissance, lieu_naissance FROM users WHERE heure_naissance IS NOT NULL OR lieu_naissance IS NOT NULL;
-- ============================================================

BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_coordonnees_naissance_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_lieu_naissance_check;
ALTER TABLE users DROP COLUMN IF EXISTS fuseau_naissance;
ALTER TABLE users DROP COLUMN IF EXISTS longitude_naissance;
ALTER TABLE users DROP COLUMN IF EXISTS latitude_naissance;
ALTER TABLE users DROP COLUMN IF EXISTS lieu_naissance;
ALTER TABLE users DROP COLUMN IF EXISTS heure_naissance;

COMMIT;
