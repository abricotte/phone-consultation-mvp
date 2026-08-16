-- ============================================================
-- 013 — LE MOT D'ELENA
-- Migration ADDITIVE et IDEMPOTENTE. Aucun DROP.
-- Rollback : 013_mot_elena_rollback.sql
--
-- Un message court, écrit par Elena dans son cabinet, affiché sur
-- l'espace de TOUTES les clientes sous leur bonjour. Un seul mot à la
-- fois : le nouveau remplace l'ancien. Aucun mot → la citation du jour
-- reprend sa place. Jamais de notification, jamais d'envoi : c'est
-- l'espace qui s'illumine quand la cliente vient, pas un message qui
-- la poursuit.
--
-- L'historique est conservé (chaque publication est une ligne) mais
-- seule la dernière non retirée s'affiche.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS mot_elena (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 200 caractères : de quoi dire une chose, pas de quoi faire un billet.
  -- Vérifié ici ET côté serveur ET côté navigateur.
  texte      TEXT NOT NULL CHECK (char_length(texte) BETWEEN 1 AND 200),
  publie_le  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retire     BOOLEAN NOT NULL DEFAULT FALSE
);

-- « Le mot actif ? » — la seule requête, faite à chaque ouverture d'espace
CREATE INDEX IF NOT EXISTS idx_mot_elena_actif
  ON mot_elena (publie_le DESC) WHERE retire = FALSE;

-- Comme toutes les tables du cabinet : refus par défaut. Le backend lit
-- et écrit avec la clé de service ; il vérifie le rôle en amont
-- (adminOnly pour l'écriture, jeton valide pour la lecture). C'est le
-- mécanisme d'admin existant du projet — pas d'UUID en dur.
ALTER TABLE mot_elena ENABLE ROW LEVEL SECURITY;

COMMIT;

-- VÉRIFICATION — doit renvoyer 1
SELECT COUNT(*) AS table_creee
  FROM information_schema.tables
 WHERE table_name = 'mot_elena';
