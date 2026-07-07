-- ============================================================
-- 005 — NETTOYAGE DES DONNÉES DE DÉMO DU TEMPLATE
-- - Supprime la consultante fictive "Marie Dupont" (+ son user)
-- - Corrige la fiche consultant d'Elena : spécialité, description
--   UTF-8 propre, tarif aligné sur config_tarifs (2,90 €/min)
-- Idempotent : re-exécutable sans danger.
-- ============================================================

BEGIN;

-- 1. Supprimer Marie Dupont (démo) : sessions/wallet éventuels d'abord
DELETE FROM transactions
WHERE session_id IN (
  SELECT id FROM sessions WHERE consultant_id IN (
    SELECT c.id FROM consultants c
    JOIN users u ON u.id = c.user_id
    WHERE u.first_name = 'Marie' AND u.last_name = 'Dupont'
  )
);

DELETE FROM sessions
WHERE consultant_id IN (
  SELECT c.id FROM consultants c
  JOIN users u ON u.id = c.user_id
  WHERE u.first_name = 'Marie' AND u.last_name = 'Dupont'
);

DELETE FROM consultants
WHERE user_id IN (
  SELECT id FROM users WHERE first_name = 'Marie' AND last_name = 'Dupont'
);

DELETE FROM users
WHERE first_name = 'Marie' AND last_name = 'Dupont' AND role = 'consultant';

-- 2. Corriger la fiche consultant d'Elena (tarif = config, texte propre)
UPDATE consultants
SET specialty = 'Voyance & Médiumnité',
    description = 'Voyante sur l''Amour & Médium en flashs directs.',
    rate_per_minute = 2.90,
    is_available = true
WHERE user_id IN (
  SELECT id FROM users WHERE first_name = 'Elena' AND last_name = 'Wolska'
);

COMMIT;

-- Vérification : il ne doit rester QU'Elena, à 2,90 €/min, texte propre
SELECT u.first_name, u.last_name, c.specialty, c.rate_per_minute, c.description
FROM consultants c JOIN users u ON u.id = c.user_id;
