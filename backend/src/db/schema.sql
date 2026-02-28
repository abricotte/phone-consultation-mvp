-- ============================================
-- Schéma de base de données - Phone Consultation MVP
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Table des utilisateurs (clients)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'consultant', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des consultants (profil étendu)
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialty VARCHAR(255) NOT NULL,
  description TEXT,
  rate_per_minute DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  is_available BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des portefeuilles
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des transactions (rechargements et débits)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(255),
  stripe_payment_id VARCHAR(255),
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des sessions d'appel
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  consultant_id UUID NOT NULL REFERENCES consultants(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  rate_per_minute DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) DEFAULT 0.00,
  twilio_call_sid VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajout de la FK session_id dans transactions
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_session
  FOREIGN KEY (session_id) REFERENCES sessions(id);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_consultants_available ON consultants(is_available) WHERE is_available = true;
CREATE INDEX idx_sessions_client ON sessions(client_id);
CREATE INDEX idx_sessions_consultant ON sessions(consultant_id);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER consultants_updated_at BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
