-- ============================================================
-- 000 — BACKUP PRÉ-MIGRATION (à exécuter AVANT 001)
-- Copie intégrale des tables métier dans un schéma de secours.
-- Le plan gratuit Supabase n'a pas de backups automatiques :
-- ce script crée une copie interne instantanée et re-exécutable.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS backup_pre_migration;

DROP TABLE IF EXISTS backup_pre_migration.users;
DROP TABLE IF EXISTS backup_pre_migration.consultants;
DROP TABLE IF EXISTS backup_pre_migration.wallets;
DROP TABLE IF EXISTS backup_pre_migration.transactions;
DROP TABLE IF EXISTS backup_pre_migration.sessions;

CREATE TABLE backup_pre_migration.users        AS SELECT * FROM public.users;
CREATE TABLE backup_pre_migration.consultants  AS SELECT * FROM public.consultants;
CREATE TABLE backup_pre_migration.wallets      AS SELECT * FROM public.wallets;
CREATE TABLE backup_pre_migration.transactions AS SELECT * FROM public.transactions;
CREATE TABLE backup_pre_migration.sessions     AS SELECT * FROM public.sessions;

-- Vérification : les comptes doivent correspondre
SELECT
  (SELECT COUNT(*) FROM public.users)        AS users,
  (SELECT COUNT(*) FROM backup_pre_migration.users)        AS backup_users,
  (SELECT COUNT(*) FROM public.wallets)      AS wallets,
  (SELECT COUNT(*) FROM backup_pre_migration.wallets)      AS backup_wallets,
  (SELECT COUNT(*) FROM public.transactions) AS transactions,
  (SELECT COUNT(*) FROM backup_pre_migration.transactions) AS backup_transactions,
  (SELECT COUNT(*) FROM public.sessions)     AS sessions,
  (SELECT COUNT(*) FROM backup_pre_migration.sessions)     AS backup_sessions;
