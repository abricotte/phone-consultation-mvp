-- ============================================================
-- 011 — « CE QUE JE VEUX ABORDER »
-- Migration ADDITIVE et IDEMPOTENTE. Aucun DROP.
-- Rollback : 011_ce_que_je_veux_aborder_rollback.sql
--
-- La cliente prépare sa consultation dans son espace ; Elena le lit
-- avant de décrocher. La seule fonctionnalité qui améliore en même
-- temps l'expérience de la cliente (elle ne cherche plus ses mots au
-- téléphone, à la minute facturée) et celle de la praticienne (elle
-- sait ce qu'on vient chercher).
--
-- ⚠️ NATURE DE CE CHAMP — il est écrit PAR la cliente POUR Elena.
-- C'est l'exact inverse du carnet de la praticienne, qui reste
-- strictement privé. L'interface doit le dire clairement des deux
-- côtés : ici, la cliente sait qu'elle est lue.
-- ============================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS a_aborder TEXT;

-- L'âge du texte compte autant que son contenu : un mot écrit il y a
-- six mois, avant trois consultations, ne dit pas ce qu'on vient
-- chercher aujourd'hui. Sans cette date, Elena ne pourrait pas faire
-- la différence.
ALTER TABLE users ADD COLUMN IF NOT EXISTS a_aborder_maj_le TIMESTAMPTZ;

COMMIT;

-- VÉRIFICATION — doit renvoyer 2
SELECT COUNT(*) AS colonnes_creees
  FROM information_schema.columns
 WHERE table_name = 'users'
   AND column_name IN ('a_aborder', 'a_aborder_maj_le');
