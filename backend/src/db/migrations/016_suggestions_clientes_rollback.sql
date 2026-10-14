-- ============================================================
-- 016 — ROLLBACK la boîte à idées
-- ⚠️ Supprime la table ET toutes les idées envoyées par les clientes.
-- Avant d'exécuter :  SELECT client_id, sujet, texte, cree_le FROM suggestions_clientes;
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_suggestions_clientes_client;
DROP INDEX IF EXISTS idx_suggestions_clientes_lue;
DROP TABLE IF EXISTS suggestions_clientes;

COMMIT;
