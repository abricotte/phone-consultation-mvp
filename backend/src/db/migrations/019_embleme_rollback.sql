-- Rollback de 019 — retire l'emblème (les choix des clientes sont perdus).
-- ⚠️ À ne lancer qu'après avoir remis l'ancien code serveur : le code
-- actuel lit cette colonne.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_embleme_forme;
ALTER TABLE users DROP COLUMN IF EXISTS embleme;
