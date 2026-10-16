-- ============================================================
-- 019 — L'emblème de la cliente (16 octobre 2026)
-- ============================================================
-- Elle choisit une figure (la Licorne, la Colombe, le Cerf…) qui
-- l'accompagne dans son espace à la place d'une photo : en petit dans le
-- menu, et parmi ses cadeaux dans Mes études. Aucune photo stockée.
--
-- La liste des figures est tenue par le serveur (routes/profil.js) ;
-- la base vérifie seulement la forme du mot, pour qu'une figure ajoutée
-- plus tard ne demande pas de migration.
-- Additive et idempotente.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS embleme VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_embleme_forme') THEN
    ALTER TABLE users ADD CONSTRAINT users_embleme_forme
      CHECK (embleme IS NULL OR embleme ~ '^[a-z]{2,20}$');
  END IF;
END $$;

-- Vérification : 1 ligne, embleme, character varying
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'embleme';
