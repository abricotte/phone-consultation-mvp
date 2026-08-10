-- ============================================================
-- 007 — ROLLBACK vérification du numéro
-- Supprime les vérifications en attente. Les numéros déjà
-- confirmés restent en place (ils sont dans users.phone).
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS verifications_numero;

COMMIT;
