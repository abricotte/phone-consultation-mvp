-- ============================================================
-- 001 — ROLLBACK de la migration multi-praticiennes
-- Restaure le schéma d'origine. Les données métier (users,
-- wallets, transactions, sessions) sont CONSERVÉES telles
-- quelles ; seules les structures ajoutées sont retirées.
-- En cas de perte de données : restaurer depuis le schéma
-- backup_pre_migration (créé par 000).
-- ============================================================

BEGIN;

-- 1. Vue publique et grants
DROP VIEW IF EXISTS praticiennes_public;

-- 2. Tables ajoutées (l'ordre respecte les FK)
DROP TABLE IF EXISTS notification_logs;
DROP TABLE IF EXISTS notification_subscriptions;
DROP TABLE IF EXISTS stripe_events;

-- 3. Sessions : retirer les colonnes forfait et restaurer les statuts d'origine
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_type_check;
ALTER TABLE sessions DROP COLUMN IF EXISTS type;
ALTER TABLE sessions DROP COLUMN IF EXISTS forfait_code;
ALTER TABLE sessions DROP COLUMN IF EXISTS forfait_minutes;
ALTER TABLE sessions DROP COLUMN IF EXISTS montant_paye;
ALTER TABLE sessions DROP COLUMN IF EXISTS stripe_payment_id;
ALTER TABLE sessions DROP COLUMN IF EXISTS incident;

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'cancelled'));

-- 4. Index d'idempotence Stripe
DROP INDEX IF EXISTS idx_transactions_stripe_credit_unique;

-- 5. Wallets : restaurer l'unicité par utilisateur
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_praticienne_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_key'
  ) THEN
    ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 6. Colonnes praticienne_id
DROP INDEX IF EXISTS idx_wallets_praticienne;
DROP INDEX IF EXISTS idx_transactions_praticienne;
DROP INDEX IF EXISTS idx_sessions_praticienne;

ALTER TABLE consultants  DROP COLUMN IF EXISTS praticienne_id;
ALTER TABLE wallets      DROP COLUMN IF EXISTS praticienne_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS praticienne_id;
ALTER TABLE sessions     DROP COLUMN IF EXISTS praticienne_id;

-- 7. Table praticiennes
DROP TABLE IF EXISTS praticiennes;

-- 8. RLS : retour à l'état d'origine (désactivé)
ALTER TABLE users        DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultants  DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets      DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions     DISABLE ROW LEVEL SECURITY;

COMMIT;
