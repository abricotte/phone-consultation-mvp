-- ============================================================
-- 003 — ASCENDANTS (cliente + proches)
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Rollback : 003_ascendants_rollback.sql
--
-- L'ascendant n'est PAS calculable depuis la seule date de naissance
-- (il faut l'heure et le lieu). Il est donc saisi par la cliente si
-- elle le connaît. Facultatif, strictement privé, comme le reste.
-- ============================================================

BEGIN;

ALTER TABLE users   ADD COLUMN IF NOT EXISTS ascendant VARCHAR(20);
ALTER TABLE proches ADD COLUMN IF NOT EXISTS ascendant VARCHAR(20);

-- Valeurs autorisées : les 12 signes (slug sans accent) ou NULL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_ascendant_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_ascendant_check CHECK (
      ascendant IS NULL OR ascendant IN (
        'belier','taureau','gemeaux','cancer','lion','vierge',
        'balance','scorpion','sagittaire','capricorne','verseau','poissons'
      )
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proches_ascendant_check') THEN
    ALTER TABLE proches ADD CONSTRAINT proches_ascendant_check CHECK (
      ascendant IS NULL OR ascendant IN (
        'belier','taureau','gemeaux','cancer','lion','vierge',
        'balance','scorpion','sagittaire','capricorne','verseau','poissons'
      )
    );
  END IF;
END $$;

COMMIT;

-- VÉRIFICATION : les deux lignes doivent valoir 1
SELECT 'users.ascendant' AS objet,
       COUNT(*) FROM information_schema.columns
 WHERE table_name = 'users' AND column_name = 'ascendant'
UNION ALL
SELECT 'proches.ascendant',
       COUNT(*) FROM information_schema.columns
 WHERE table_name = 'proches' AND column_name = 'ascendant';
