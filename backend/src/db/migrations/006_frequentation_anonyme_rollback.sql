-- ============================================================
-- 006 — ROLLBACK fréquentation anonyme
-- Supprime les compteurs agrégés. Aucune donnée personnelle
-- n'y figurant, la perte est sans conséquence RGPD.
-- ============================================================

BEGIN;

DROP FUNCTION IF EXISTS incrementer_visite(UUID, DATE, SMALLINT, SMALLINT, BOOLEAN, VARCHAR);
DROP TABLE IF EXISTS visites_agregees;

COMMIT;
