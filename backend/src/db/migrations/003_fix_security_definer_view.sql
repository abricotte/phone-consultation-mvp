-- ============================================================
-- 003 — CORRECTIF ADVISOR : vue praticiennes_public
-- Alerte : "Security Definer View" sur public.praticiennes_public.
--
-- Correction (bonne pratique Supabase) :
--   1. La vue passe en security_invoker = on : elle s'exécute avec
--      les droits du LECTEUR (plus de contournement du RLS).
--   2. Une policy RLS autorise la lecture des lignes praticiennes.
--   3. Les GRANTs par COLONNE limitent la lecture aux 5 champs
--      publics — colonne par colonne, tout le reste est refusé :
--      domaine, en_ligne_depuis, auto_off_heures, config_tarifs,
--      config_notifications, stripe_account_ref, numero_twilio,
--      messages_vocaux, created_at, updated_at → INTERDITS.
--
-- Le statut en ligne reste lisible (indicateur temps réel).
-- Idempotent : re-exécutable sans danger.
-- ============================================================

BEGIN;

-- 1. Fin du SECURITY DEFINER : la vue respecte les droits du lecteur
ALTER VIEW praticiennes_public SET (security_invoker = on);

-- 2. Policy RLS : lignes praticiennes lisibles par les rôles clients
DROP POLICY IF EXISTS "lecture_publique_praticiennes" ON praticiennes;
CREATE POLICY "lecture_publique_praticiennes" ON praticiennes
  FOR SELECT TO anon, authenticated
  USING (true);

-- 3. Verrouillage COLONNE PAR COLONNE :
--    on retire tout, puis on n'accorde QUE les champs publics.
REVOKE ALL ON praticiennes FROM anon, authenticated;
GRANT SELECT (id, nom_public, slug, statut_en_ligne, config_branding)
  ON praticiennes TO anon, authenticated;

-- La vue reste lisible (elle ne référence QUE les 5 colonnes accordées)
GRANT SELECT ON praticiennes_public TO anon, authenticated;

COMMIT;

-- ------------------------------------------------------------
-- VÉRIFICATION 1 (doit RÉUSSIR) : lecture publique via la vue
-- ------------------------------------------------------------
BEGIN;
SET LOCAL ROLE anon;
SELECT * FROM praticiennes_public;
ROLLBACK;

-- ------------------------------------------------------------
-- VÉRIFICATION 2 (doit ÉCHOUER avec "permission denied") :
-- à exécuter SÉPARÉMENT — l'erreur est le résultat attendu.
-- ------------------------------------------------------------
-- BEGIN;
-- SET LOCAL ROLE anon;
-- SELECT stripe_account_ref, numero_twilio FROM praticiennes;
-- ROLLBACK;
