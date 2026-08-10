-- ============================================================
-- 008 — ROLLBACK appels entrants
-- Restaure la contrainte de type d'origine. À n'exécuter QUE si
-- aucune session de type 'entrant' n'existe encore, sans quoi la
-- contrainte sera refusée (des lignes deviendraient invalides).
-- Pour le vérifier :
--   SELECT COUNT(*) FROM sessions WHERE type = 'entrant';
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_users_phone_chiffres;
DROP INDEX IF EXISTS idx_users_recherche;

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_type_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_type_check
  CHECK (type IN ('minute', 'forfait', 'forfait_manuel'));

COMMIT;
