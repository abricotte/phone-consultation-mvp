-- ============================================================
-- 017 — L'HEURE ET LE LIEU DE NAISSANCE (le thème astral)
-- Migration ADDITIVE et IDEMPOTENTE. Aucun DROP.
-- Rollback : 017_naissance_heure_lieu_rollback.sql
--
-- Le thème astral (la carte du ciel) demande l'heure et le lieu de la
-- naissance. Facultatifs : sans l'heure, on lit les planètes en signes,
-- jamais l'ascendant ni les maisons (on n'invente pas). Le lieu est
-- gardé tel que la cliente l'a choisi (ville, pays), avec ses
-- coordonnées et son fuseau horaire IANA, pour recalculer le ciel sans
-- rien redemander. Elena seule voit ces champs au cabinet.
-- ============================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS heure_naissance    TIME;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lieu_naissance     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude_naissance  NUMERIC(8,5);
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude_naissance NUMERIC(8,5);
ALTER TABLE users ADD COLUMN IF NOT EXISTS fuseau_naissance    TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_lieu_naissance_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_lieu_naissance_check CHECK (
      lieu_naissance IS NULL OR char_length(lieu_naissance) <= 160
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_coordonnees_naissance_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_coordonnees_naissance_check CHECK (
      (latitude_naissance IS NULL AND longitude_naissance IS NULL)
      OR (latitude_naissance BETWEEN -90 AND 90 AND longitude_naissance BETWEEN -180 AND 180)
    );
  END IF;
END $$;

COMMIT;

-- VÉRIFICATION — doit renvoyer 5
-- SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users'
--   AND column_name IN ('heure_naissance','lieu_naissance','latitude_naissance','longitude_naissance','fuseau_naissance');
