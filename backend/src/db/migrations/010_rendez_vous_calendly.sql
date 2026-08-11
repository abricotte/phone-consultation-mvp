-- ============================================================
-- 010 — RENDEZ-VOUS CALENDLY
-- Migration ADDITIVE et IDEMPOTENTE. Aucun DROP : l'éditeur Supabase
-- ne signalera rien.
-- Rollback : 010_rendez_vous_calendly_rollback.sql
--
-- Volume visé : ~5 forfaits par jour, 25 par semaine. Les retrouver
-- dans une boîte mail n'est plus tenable.
--
-- PRINCIPE COMPTABLE — un rendez-vous porte l'ARGENT REÇU (Calendly
-- encaisse au moment de la réservation), la session porte la PRESTATION.
-- Une session rattachée à un rendez-vous n'ajoute donc aucun revenu :
-- il est déjà compté à sa date de paiement. Sans cette règle, la même
-- consultation compterait deux fois.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------------
-- 1. Origine d'une fiche cliente
--
-- Une réservation Calendly crée une fiche pour une personne qui n'a
-- rien demandé : elle doit exister pour son historique et ses notes,
-- mais son compte ne doit pas être connectable tant qu'elle ne s'est
-- pas inscrite elle-même.
--
-- Ce marqueur explicite permet aussi le RATTACHEMENT : si elle
-- s'inscrit plus tard avec le même email, l'inscription reprend cette
-- fiche au lieu d'en créer une seconde — son historique reste d'un
-- seul tenant.
-- ------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS origine VARCHAR(20) NOT NULL DEFAULT 'inscription';

-- Retrouver une cliente par son numéro quel que soit le format composé
-- (même clé que numeros_bloques : les chiffres seuls).
CREATE INDEX IF NOT EXISTS idx_users_email_bas ON users (LOWER(email));

-- ------------------------------------------------------------------
-- 2. Les rendez-vous
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rendez_vous (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- IDENTITÉ CALENDLY — l'unicité rend le webhook idempotent. Calendly
  -- réémet ses événements en cas d'échec ; sans elle, un simple réessai
  -- créerait un doublon dans la liste du jour.
  calendly_event_uri    TEXT NOT NULL UNIQUE,
  calendly_invitee_uri  TEXT,

  -- RATTACHEMENT — nullable : une inconnue reste enregistrée et
  -- rattachable plus tard. `chiffres` la retrouve quel que soit le
  -- format composé.
  client_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  telephone             VARCHAR(20),
  chiffres              VARCHAR(20),
  nom                   TEXT,
  email                 TEXT,

  -- LE RENDEZ-VOUS
  formule               TEXT,          -- libellé du type d'événement Calendly
  forfait_code          TEXT,          -- correspondance avec config_tarifs.forfaits
  minutes               INTEGER,       -- durée annoncée (20, 45…)
  debut                 TIMESTAMPTZ NOT NULL,
  fin                   TIMESTAMPTZ,

  -- prevu   : à honorer. Reste visible tant que la consultation n'a pas
  --           EU LIEU — un appel lancé mais raté ne le fait pas sortir.
  -- honore  : les deux se sont réellement parlé.
  -- annule  : annulé côté Calendly.
  --
  -- Pas de statut « manqué » : « à rattraper » se DÉDUIT (debut passé et
  -- statut encore 'prevu'). Un statut stocké exigerait une tâche de fond
  -- pour le poser, et ferait disparaître de la liste un rendez-vous
  -- qu'Elena veut justement continuer à voir.
  statut                VARCHAR(20) NOT NULL DEFAULT 'prevu'
                        CHECK (statut IN ('prevu', 'honore', 'annule')),

  -- MÉMOIRE DES TENTATIVES — un appel lancé qui n'aboutit pas laisse une
  -- trace sans faire sortir le rendez-vous de la liste. Sans cela, Elena
  -- ne saurait plus si elle a déjà essayé d'appeler, ou pas encore.
  tentatives            INTEGER NOT NULL DEFAULT 0,
  derniere_tentative    TIMESTAMPTZ,

  -- L'ARGENT — encaissé par Calendly à la réservation. `paye_le` est la
  -- date du PAIEMENT, pas celle du rendez-vous : c'est elle qui fait foi
  -- pour un chiffre d'affaires déclaré à l'encaissement.
  montant_paye          NUMERIC(10,2),
  paye_le               TIMESTAMPTZ,

  -- LE LIEN QUI EMPÊCHE LE DOUBLE COMPTAGE
  session_id            UUID REFERENCES sessions(id) ON DELETE SET NULL,

  charge_utile          JSONB,         -- payload brut, pour déboguer sans redemander
  cree_le               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  maj_le                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- « Mes rendez-vous du jour » : les prévus, dans l'ordre chronologique
CREATE INDEX IF NOT EXISTS idx_rdv_jour
  ON rendez_vous (debut) WHERE statut = 'prevu';
CREATE INDEX IF NOT EXISTS idx_rdv_client   ON rendez_vous (client_id);
CREATE INDEX IF NOT EXISTS idx_rdv_chiffres ON rendez_vous (chiffres);

-- Comme toutes les tables du cabinet : refus par défaut. Le backend y
-- accède avec la clé de service, qui contourne RLS.
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATIONS — les deux lignes doivent valoir 1
SELECT 'table rendez_vous' AS objet, COUNT(*)
  FROM information_schema.tables WHERE table_name = 'rendez_vous'
UNION ALL
SELECT 'colonne users.origine', COUNT(*)
  FROM information_schema.columns
 WHERE table_name = 'users' AND column_name = 'origine';
