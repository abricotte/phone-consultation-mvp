-- ============================================================
-- 002 — SUPPRESSION DES DEFAULT praticienne_id  ⚠️ OBLIGATOIRE
--
-- À exécuter UNIQUEMENT quand le refactoring backend est terminé,
-- c'est-à-dire quand TOUTES les insertions (wallets, sessions,
-- transactions, consultants, notification_subscriptions) passent
-- explicitement praticienne_id.
--
-- Ces DEFAULT (id d'Elena) n'existent que pour la transition
-- zéro-interruption. Ils NE DOIVENT PAS survivre à l'arrivée
-- d'une deuxième praticienne : sinon toute insertion oubliant
-- praticienne_id serait silencieusement attribuée à Elena.
-- ============================================================

BEGIN;

ALTER TABLE consultants                ALTER COLUMN praticienne_id DROP DEFAULT;
ALTER TABLE wallets                    ALTER COLUMN praticienne_id DROP DEFAULT;
ALTER TABLE transactions               ALTER COLUMN praticienne_id DROP DEFAULT;
ALTER TABLE sessions                   ALTER COLUMN praticienne_id DROP DEFAULT;
ALTER TABLE notification_subscriptions ALTER COLUMN praticienne_id DROP DEFAULT;

COMMIT;

-- Vérification : la colonne "column_default" doit être vide (NULL) partout
SELECT table_name, column_name, column_default
FROM information_schema.columns
WHERE column_name = 'praticienne_id'
ORDER BY table_name;
