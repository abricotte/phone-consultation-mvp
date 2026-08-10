-- ============================================================
-- 006 — FRÉQUENTATION ANONYME (compteurs agrégés)
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Rollback : 006_frequentation_anonyme_rollback.sql
--
-- OBJECTIF : choisir les horaires de permanence sur la demande
-- réellement observée, plutôt que sur des suppositions.
--
-- CONCEPTION ANONYME PAR CONSTRUCTION :
--   • aucun identifiant de compte n'est stocké — ni en clair, ni
--     haché, ni salé (un hash d'identifiant resterait une donnée
--     personnelle au sens du RGPD)
--   • aucune adresse IP, aucun agent utilisateur
--   • une seule ligne par (jour, heure, avec_credit) : un compteur
--     entier, rien d'autre. Impossible de remonter à une personne.
--
-- La déduplication se fait CÔTÉ NAVIGATEUR : il retient localement
-- qu'il a déjà été compté pour le créneau en cours et n'envoie pas
-- de second signal. Le serveur ne sait donc jamais qui revient.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS visites_agregees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  praticienne_id UUID NOT NULL REFERENCES praticiennes(id) ON DELETE CASCADE
    DEFAULT 'e1e0a000-0000-4000-8000-000000000001',
  jour DATE NOT NULL,
  heure SMALLINT NOT NULL CHECK (heure BETWEEN 0 AND 23),
  -- 0 = dimanche … 6 = samedi (convention JavaScript)
  jour_semaine SMALLINT NOT NULL CHECK (jour_semaine BETWEEN 0 AND 6),
  -- Distingue « prête à appeler » de « découverte ou hésitation »
  avec_credit BOOLEAN NOT NULL,
  -- Page d'où vient la visite : 'accueil' ou 'consultation-minute'
  page VARCHAR(30) NOT NULL DEFAULT 'accueil',
  compteur INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (praticienne_id, jour, heure, avec_credit, page)
);

CREATE INDEX IF NOT EXISTS idx_visites_jour ON visites_agregees(praticienne_id, jour);

-- Incrémentation atomique : crée la ligne du créneau ou ajoute 1.
-- SECURITY DEFINER non nécessaire — le backend passe en service role.
CREATE OR REPLACE FUNCTION incrementer_visite(
  p_praticienne UUID,
  p_jour DATE,
  p_heure SMALLINT,
  p_jour_semaine SMALLINT,
  p_avec_credit BOOLEAN,
  p_page VARCHAR
) RETURNS VOID AS $$
BEGIN
  INSERT INTO visites_agregees (
    praticienne_id, jour, heure, jour_semaine, avec_credit, page, compteur
  )
  VALUES (p_praticienne, p_jour, p_heure, p_jour_semaine, p_avec_credit, p_page, 1)
  ON CONFLICT (praticienne_id, jour, heure, avec_credit, page)
  DO UPDATE SET compteur = visites_agregees.compteur + 1,
                updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

ALTER TABLE visites_agregees ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION — doit renvoyer 1
SELECT COUNT(*) AS table_visites_agregees
  FROM information_schema.tables
 WHERE table_name = 'visites_agregees';
