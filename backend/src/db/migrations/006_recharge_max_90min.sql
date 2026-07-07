-- ============================================================
-- 006 — RECHARGE IMMÉDIATE : durée maximale 60 → 90 minutes
-- Ne concerne QUE la Consultation Immédiate (à la minute).
-- Aucun forfait 90 min créé — le tarif reste 2,90 €/min plein tarif
-- (90 min = 261 €). Idempotent : re-exécutable sans danger.
-- ============================================================

BEGIN;

UPDATE praticiennes
SET config_tarifs = jsonb_set(
  config_tarifs,
  '{recharge,max_minutes}',
  '90'::jsonb
)
WHERE slug = 'elena-wolska';

COMMIT;

-- Vérification : max_minutes doit afficher 90
SELECT nom_public, config_tarifs->'recharge' AS recharge
FROM praticiennes
WHERE slug = 'elena-wolska';
