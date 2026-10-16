-- Rollback de 020 — retire les réponses d'Elena (elles sont perdues).
-- ⚠️ À ne lancer qu'après avoir remis l'ancien code serveur.
ALTER TABLE suggestions_clientes DROP CONSTRAINT IF EXISTS suggestions_reponse_longueur;
ALTER TABLE suggestions_clientes DROP COLUMN IF EXISTS repondu_le;
ALTER TABLE suggestions_clientes DROP COLUMN IF EXISTS reponse;
