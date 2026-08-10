-- ============================================================
-- 008 — APPELS ENTRANTS (fiche express)
-- Migration ADDITIVE et IDEMPOTENTE (re-exécutable sans danger).
-- Rollback : 008_appels_entrants_rollback.sql
--
-- Quand une cliente compose directement le numéro de la ligne, le
-- cabinet doit pouvoir afficher sa fiche express. On enregistre donc
-- l'appel comme une session de type 'entrant' — le cabinet interroge
-- déjà /admin/statut toutes les 10 s, il la verra sans nouveau
-- mécanisme (ni table, ni WebSocket).
--
-- ⚠️ Cette migration contient un DROP CONSTRAINT : l'éditeur Supabase
-- affichera un avertissement « opération destructive ». Il est ici
-- INÉVITABLE — PostgreSQL ne sait pas modifier une contrainte CHECK
-- sans la remplacer. Elle est recréée dans la MÊME transaction, en
-- plus permissive : aucune donnée n'est touchée, rien ne peut devenir
-- invalide. Vous pouvez confirmer sans crainte.
-- ============================================================

BEGIN;

-- Autoriser le nouveau type, en conservant les trois existants
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_type_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_type_check
  CHECK (type IN ('minute', 'forfait', 'forfait_manuel', 'entrant'));

-- Retrouver une cliente par son numéro quel qu'en soit le format :
-- l'index porte sur les chiffres seuls, comme la fonction de
-- normalisation côté serveur (cf. src/utils/telephone.js).
CREATE INDEX IF NOT EXISTS idx_users_phone_chiffres
  ON users ((regexp_replace(phone, '\D', '', 'g')));

-- Recherche cliente du cabinet : accélère le filtrage sur le nom
CREATE INDEX IF NOT EXISTS idx_users_recherche
  ON users (role, first_name, last_name);

COMMIT;

-- VÉRIFICATIONS — les deux lignes doivent valoir 1
SELECT 'type entrant autorisé' AS objet,
       COUNT(*) FROM pg_constraint
 WHERE conname = 'sessions_type_check'
   AND pg_get_constraintdef(oid) LIKE '%entrant%'
UNION ALL
SELECT 'index numéro',
       COUNT(*) FROM pg_indexes WHERE indexname = 'idx_users_phone_chiffres';
