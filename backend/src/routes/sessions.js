const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { getPraticienne, getTarifs, getStatutEnLigne } = require('../config/praticienne');

const router = express.Router();

// Libellé lisible de la formule pour l'historique de la cliente.
// minute → « Consultation Immédiate » ; forfaits → nom du forfait.
function nomFormule(s) {
  if (s.type === 'forfait' || s.type === 'forfait_manuel') {
    if (s.forfait_code === 'decouverte') return 'Consultation Découverte';
    if (s.forfait_code === 'complete') return 'Consultation Complète';
    return s.forfait_minutes ? `Forfait ${s.forfait_minutes} min` : 'Forfait';
  }
  return 'Consultation Immédiate';
}

// POST /api/sessions - Démarrer une session de Consultation Immédiate.
// Mono-praticienne : le consultant est résolu automatiquement, le tarif
// vient de config_tarifs (jamais de la fiche consultant).
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Machine à états : la praticienne doit être "disponible"
    const { statut } = await getStatutEnLigne();
    if (statut === 'en_consultation') {
      return res.status(409).json({
        error: 'Elena vient de commencer une consultation. Réessayez dans quelques instants.',
      });
    }
    if (statut !== 'disponible') {
      return res.status(400).json({ error: 'Elena n\'est pas en ligne actuellement.' });
    }

    // Résoudre le profil consultant de la praticienne (pour le téléphone)
    const p = await getPraticienne();
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .select('id')
      .eq('praticienne_id', p.id)
      .limit(1)
      .single();

    if (consultantError || !consultant) {
      return res.status(500).json({ error: 'Profil praticienne introuvable.' });
    }

    // Tarif : source unique = config_tarifs de la praticienne
    const tarifs = await getTarifs();
    const ratePerMinute = tarifs.prixMinuteCents / 100;

    // Vérifier que la cliente a le crédit minimum
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', req.user.id)
      .single();

    const minBalanceCents = tarifs.creditMinimumMinutes * tarifs.prixMinuteCents;
    const balanceCents = wallet ? Math.round(parseFloat(wallet.balance) * 100) : 0;
    if (!wallet || balanceCents < minBalanceCents) {
      return res.status(400).json({
        error: `Crédit insuffisant : un minimum de ${tarifs.creditMinimumMinutes} minutes (${(minBalanceCents / 100)
          .toFixed(2)
          .replace('.', ',')} €) est requis pour lancer l'appel. Rechargez votre crédit pour continuer.`,
      });
    }

    // Créer la session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        client_id: req.user.id,
        consultant_id: consultant.id,
        type: 'minute',
        rate_per_minute: ratePerMinute,
        status: 'pending',
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    res.status(201).json({
      id: session.id,
      status: session.status,
      ratePerMinute: session.rate_per_minute,
      message: 'Session créée, en attente de connexion',
    });
  } catch (err) {
    console.error('Erreur création session:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/sessions/:id/end - Terminer une session
router.patch('/:id/end', authMiddleware, async (req, res) => {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Cette session n\'est pas active' });
    }

    // Calculer la durée et le coût.
    // Franchise de connexion : moins de 60 s = aucune facturation
    // (même règle que finalizeSession dans calls.js).
    const startedAt = new Date(session.started_at);
    const endedAt = new Date();
    const durationSeconds = Math.ceil((endedAt - startedAt) / 1000);
    const durationMinutes = durationSeconds < 60 ? 0 : Math.ceil(durationSeconds / 60);
    const totalCost = durationMinutes * parseFloat(session.rate_per_minute);

    // Mettre à jour la session
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        total_cost: totalCost,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Débiter le client (rien à débiter sous la franchise de 60 s)
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', session.client_id)
      .single();

    if (wallet && totalCost > 0) {
      const newBalance = Math.max(0, parseFloat(wallet.balance) - totalCost);

      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'debit',
          amount: totalCost,
          description: `Consultation - ${durationMinutes} min`,
          session_id: session.id,
        });
    }

    res.json({
      id: updatedSession.id,
      status: 'completed',
      durationSeconds,
      durationMinutes,
      totalCost,
      message: `Session terminée. Durée : ${durationMinutes} min. Coût : ${totalCost}€`,
    });
  } catch (err) {
    console.error('Erreur fin session:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sessions/history - Historique des sessions
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const isConsultant = req.user.role === 'consultant';
    const column = isConsultant ? 'consultant_id' : 'client_id';

    let filterValue = req.user.id;

    // Si consultant, on a besoin de son consultant.id (pas user.id)
    if (isConsultant) {
      const { data: consultant } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!consultant) {
        return res.status(404).json({ error: 'Profil consultant non trouvé' });
      }
      filterValue = consultant.id;
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, status, type, forfait_code, forfait_minutes, montant_paye, started_at, ended_at, duration_seconds, rate_per_minute, total_cost, created_at')
      .eq(column, filterValue)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(sessions.map((s) => ({
      id: s.id,
      status: s.status,
      type: s.type,
      formule: nomFormule(s),
      forfaitMinutes: s.forfait_minutes,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationSeconds: s.duration_seconds,
      ratePerMinute: s.rate_per_minute,
      // Montant facturé : forfait = montant payé, minute = coût calculé
      montant:
        s.type === 'forfait' || s.type === 'forfait_manuel'
          ? (s.montant_paye != null ? parseFloat(s.montant_paye) : null)
          : (s.total_cost != null ? parseFloat(s.total_cost) : null),
      createdAt: s.created_at,
    })));
  } catch (err) {
    console.error('Erreur historique sessions:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
