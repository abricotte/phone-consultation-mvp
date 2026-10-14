-- ============================================================
-- 015 — ROLLBACK les commandes de tirages
-- ⚠️ Supprime la table ET toutes les commandes (reçues, livrées).
-- Avant d'exécuter :  SELECT client_id, type, statut, montant, cree_le FROM commandes_tirages;
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_commandes_tirages_client;
DROP INDEX IF EXISTS idx_commandes_tirages_statut;
DROP TABLE IF EXISTS commandes_tirages;

COMMIT;
