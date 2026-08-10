-- ============================================================
-- 007 — VÉRIFICATION DU NUMÉRO DE LA PRATICIENNE
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Rollback : 007_verification_numero_rollback.sql
--
-- POURQUOI : le numéro de la praticienne est celui que Twilio compose
-- pour la joindre. Une faute de frappe la rendrait injoignable sans
-- qu'elle comprenne pourquoi — c'est exactement l'incident vécu.
--
-- Le nouveau numéro est donc mis EN ATTENTE ici, Twilio l'appelle et
-- énonce un code, et il ne remplace l'ancien qu'une fois le code saisi.
-- Tant que la vérification n'aboutit pas, l'ancien numéro reste actif.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS verifications_numero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Le numéro candidat, au format E.164
  telephone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  tentatives SMALLINT NOT NULL DEFAULT 0,
  expire_le TIMESTAMPTZ NOT NULL,
  call_sid VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Une seule vérification en attente par personne
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_verifications_expire
  ON verifications_numero(expire_le);

ALTER TABLE verifications_numero ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION — doit renvoyer 1
SELECT COUNT(*) AS table_verifications_numero
  FROM information_schema.tables
 WHERE table_name = 'verifications_numero';
