-- ============================================================
-- 001 — ARCHITECTURE MULTI-PRATICIENNES + NOTIFICATIONS + RLS
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Prérequis : 000_backup_pre_migration.sql exécuté.
-- Rollback : 001_multi_praticiennes_rollback.sql
--
-- Principe zéro-interruption : l'id d'Elena est FIXE et posé en
-- DEFAULT sur toutes les colonnes praticienne_id → le backend
-- actuel continue de fonctionner sans modification immédiate.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. TABLE praticiennes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS praticiennes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_public VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domaine VARCHAR(255),
  statut_en_ligne BOOLEAN NOT NULL DEFAULT false,
  en_ligne_depuis TIMESTAMPTZ,              -- posé quand statut passe à true (auto-off)
  auto_off_heures INTEGER NOT NULL DEFAULT 4,
  config_branding JSONB NOT NULL DEFAULT '{}',
  config_tarifs JSONB NOT NULL DEFAULT '{}',
  config_notifications JSONB NOT NULL DEFAULT '{}',  -- plage SMS, anti-spam, expéditeur
  stripe_account_ref VARCHAR(255),           -- SENSIBLE — jamais exposé côté client
  numero_twilio VARCHAR(30),                 -- SENSIBLE — jamais exposé côté client
  messages_vocaux JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS praticiennes_updated_at ON praticiennes;
CREATE TRIGGER praticiennes_updated_at BEFORE UPDATE ON praticiennes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- 2. SEED Elena Wolska (id FIXE, utilisé comme DEFAULT partout)
-- ------------------------------------------------------------
INSERT INTO praticiennes (
  id, nom_public, slug, domaine, numero_twilio,
  config_branding, config_tarifs, config_notifications, messages_vocaux
) VALUES (
  'e1e0a000-0000-4000-8000-000000000001',
  'Elena Wolska',
  'elena-wolska',
  'consultation.elena-wolska.com',
  '+33162290799',
  '{
    "nom_affiche": "Elena Wolska",
    "tagline": "Voyante sur l''Amour & Médium en Flashs Directs",
    "couleurs": {"principale": "#e46a5d", "fond": "#fcf9f1", "or": "#c9a96e", "fonce": "#3d1c54"},
    "polices": {"titres": "Cormorant", "texte": "Open Sans"}
  }',
  '{
    "devise": "EUR",
    "prix_minute": 2.90,
    "credit_minimum_minutes": 5,
    "bip_avant_fin_secondes": 120,
    "arrondi": "minute_superieure",
    "forfaits": [
      {"code": "decouverte", "nom": "Consultation Découverte", "minutes": 20, "prix": 58},
      {"code": "complete",   "nom": "Consultation Complète",   "minutes": 45, "prix": 129}
    ],
    "recharge": {
      "suggestions_minutes": [10, 20, 30],
      "defaut_minutes": 20,
      "pas_minutes": 5,
      "min_minutes": 5,
      "max_minutes": 90
    }
  }',
  '{
    "sms": {
      "actif": true,
      "heure_debut": "09:00",
      "heure_fin": "20:00",
      "fuseau": "Europe/Paris",
      "jours_exclus": ["dimanche"],
      "exclure_jours_feries": true,
      "max_par_cliente_par_24h": 1,
      "expediteur": null
    },
    "email": {"actif": true}
  }',
  '{
    "accueil_cliente": null,
    "accueil_praticienne": null,
    "avertissement_fin": null,
    "fin_consultation": null,
    "tts_langue": "fr-FR"
  }'
) ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- 3. praticienne_id sur les tables métier
--    DEFAULT = Elena → le backend actuel continue de fonctionner.
--    Backfill idempotent (WHERE ... IS NULL), puis NOT NULL.
-- ------------------------------------------------------------
ALTER TABLE consultants  ADD COLUMN IF NOT EXISTS praticienne_id UUID REFERENCES praticiennes(id) DEFAULT 'e1e0a000-0000-4000-8000-000000000001';
ALTER TABLE wallets      ADD COLUMN IF NOT EXISTS praticienne_id UUID REFERENCES praticiennes(id) DEFAULT 'e1e0a000-0000-4000-8000-000000000001';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS praticienne_id UUID REFERENCES praticiennes(id) DEFAULT 'e1e0a000-0000-4000-8000-000000000001';
ALTER TABLE sessions     ADD COLUMN IF NOT EXISTS praticienne_id UUID REFERENCES praticiennes(id) DEFAULT 'e1e0a000-0000-4000-8000-000000000001';

UPDATE consultants  SET praticienne_id = 'e1e0a000-0000-4000-8000-000000000001' WHERE praticienne_id IS NULL;
UPDATE wallets      SET praticienne_id = 'e1e0a000-0000-4000-8000-000000000001' WHERE praticienne_id IS NULL;
UPDATE transactions SET praticienne_id = 'e1e0a000-0000-4000-8000-000000000001' WHERE praticienne_id IS NULL;
UPDATE sessions     SET praticienne_id = 'e1e0a000-0000-4000-8000-000000000001' WHERE praticienne_id IS NULL;

ALTER TABLE consultants  ALTER COLUMN praticienne_id SET NOT NULL;
ALTER TABLE wallets      ALTER COLUMN praticienne_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN praticienne_id SET NOT NULL;
ALTER TABLE sessions     ALTER COLUMN praticienne_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wallets_praticienne      ON wallets(praticienne_id);
CREATE INDEX IF NOT EXISTS idx_transactions_praticienne ON transactions(praticienne_id);
CREATE INDEX IF NOT EXISTS idx_sessions_praticienne     ON sessions(praticienne_id);

-- ------------------------------------------------------------
-- 4. WALLET par (cliente, praticienne) — plus de wallet global
-- ------------------------------------------------------------
ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_id_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_praticienne_key'
  ) THEN
    ALTER TABLE wallets
      ADD CONSTRAINT wallets_user_praticienne_key UNIQUE (user_id, praticienne_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 5. SESSIONS : support des forfaits + statuts d'incident
-- ------------------------------------------------------------
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'minute';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS forfait_code VARCHAR(50);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS forfait_minutes INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS montant_paye DECIMAL(10, 2);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS incident TEXT;  -- log coupure technique / recrédit

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_type_check') THEN
    ALTER TABLE sessions ADD CONSTRAINT sessions_type_check
      CHECK (type IN ('minute', 'forfait'));
  END IF;
END $$;

-- Statuts étendus : failed (appel non abouti), refunded (recrédité)
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'failed', 'refunded'));

-- ------------------------------------------------------------
-- 6. IDEMPOTENCE STRIPE
-- ------------------------------------------------------------
-- Registre des événements webhook traités (dédoublonnage sur retry)
CREATE TABLE IF NOT EXISTS stripe_events (
  id VARCHAR(255) PRIMARY KEY,          -- event.id Stripe
  type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un paiement Stripe ne peut créditer qu'une seule fois
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_credit_unique
  ON transactions (stripe_payment_id)
  WHERE stripe_payment_id IS NOT NULL AND type = 'credit';

-- ------------------------------------------------------------
-- 7. NOTIFICATIONS "Elena est en ligne"
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  praticienne_id UUID NOT NULL REFERENCES praticiennes(id) ON DELETE CASCADE
    DEFAULT 'e1e0a000-0000-4000-8000-000000000001',
  canal VARCHAR(10) NOT NULL CHECK (canal IN ('sms', 'email')),
  destination VARCHAR(255) NOT NULL,        -- numéro ou email (donnée personnelle — RLS strict)
  consentement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consentement_texte TEXT,                  -- preuve RGPD : texte de la case cochée
  dernier_envoi TIMESTAMPTZ,
  actif BOOLEAN NOT NULL DEFAULT true,
  desinscription_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),  -- lien inclus dans CHAQUE SMS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, praticienne_id, canal)
);

DROP TRIGGER IF EXISTS notification_subscriptions_updated_at ON notification_subscriptions;
CREATE TRIGGER notification_subscriptions_updated_at
  BEFORE UPDATE ON notification_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Log de CHAQUE tentative d'envoi (envoyé, ignoré, échec)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES notification_subscriptions(id) ON DELETE SET NULL,
  praticienne_id UUID NOT NULL REFERENCES praticiennes(id),
  canal VARCHAR(10) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  message TEXT,
  statut VARCHAR(30) NOT NULL CHECK (
    statut IN ('envoye', 'echec', 'ignore_hors_plage', 'ignore_antispam', 'ignore_inactif')
  ),
  fournisseur_sid VARCHAR(255),             -- SID Twilio / id Resend
  erreur TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_subscription ON notification_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notif_subs_actives
  ON notification_subscriptions(praticienne_id) WHERE actif = true;

-- ------------------------------------------------------------
-- 8. RLS — verrouillage
--    Le backend utilise la SERVICE ROLE KEY (bypass RLS) : activer
--    RLS sans policy = tout accès direct anon/authenticated refusé.
-- ------------------------------------------------------------
ALTER TABLE praticiennes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;  -- données perso : AUCUNE lecture publique
ALTER TABLE notification_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events              ENABLE ROW LEVEL SECURITY;
-- Tables existantes : même durcissement (le backend passe par service role)
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions     ENABLE ROW LEVEL SECURITY;

-- Vue PUBLIQUE : uniquement les champs non sensibles de la praticienne.
-- (stripe_account_ref, numero_twilio, configs internes : JAMAIS ici)
-- security_invoker = on : la vue s'exécute avec les droits du LECTEUR
-- (pas de contournement du RLS — exigence Advisor Supabase).
CREATE OR REPLACE VIEW praticiennes_public
  WITH (security_invoker = on) AS
  SELECT id, nom_public, slug, statut_en_ligne, config_branding
  FROM praticiennes;

-- Lecture des lignes autorisée, mais UNIQUEMENT les colonnes publiques
DROP POLICY IF EXISTS "lecture_publique_praticiennes" ON praticiennes;
CREATE POLICY "lecture_publique_praticiennes" ON praticiennes
  FOR SELECT TO anon, authenticated
  USING (true);

REVOKE ALL ON praticiennes FROM anon, authenticated;
GRANT SELECT (id, nom_public, slug, statut_en_ligne, config_branding)
  ON praticiennes TO anon, authenticated;

GRANT SELECT ON praticiennes_public TO anon, authenticated;

COMMIT;

-- ------------------------------------------------------------
-- VÉRIFICATIONS POST-MIGRATION (à exécuter après le COMMIT)
-- ------------------------------------------------------------
SELECT 'praticiennes' AS t, COUNT(*) FROM praticiennes
UNION ALL SELECT 'wallets sans praticienne', COUNT(*) FROM wallets WHERE praticienne_id IS NULL
UNION ALL SELECT 'sessions sans praticienne', COUNT(*) FROM sessions WHERE praticienne_id IS NULL
UNION ALL SELECT 'transactions sans praticienne', COUNT(*) FROM transactions WHERE praticienne_id IS NULL;
-- Attendu : praticiennes = 1, tous les "sans praticienne" = 0
