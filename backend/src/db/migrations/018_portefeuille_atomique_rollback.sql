-- Rollback de 018 — retire les deux fonctions (aucune donnée touchée).
-- ⚠️ À ne lancer qu'après avoir remis l'ancien code serveur : le code
-- actuel appelle ces fonctions.
DROP FUNCTION IF EXISTS public.crediter_recharge(UUID, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.debiter_consultation(UUID, NUMERIC, UUID, TEXT);
