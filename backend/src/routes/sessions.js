const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/sessions - Démarrer une session (demander un appel)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { consultantId } = req.body;

    if (!consultantId) {
      return res.status(400).json({ error: 'ID du consultant requis' });
    }

    // Vérifier que le consultant existe et est disponible
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .select('id, rate_per_minute, is_available')
      .eq('id', consultantId)
      .single();

    if (consultantError || !consultant) {
      return res.status(404).json({ error: 'Consultant non trouvé' });
    }

    if (!consultant.is_available) {
      return res.status(400).json({ error: 'Ce consultant n\'est pas disponible' });
    }

    // Vérifier que le client a du solde (au moins 5 minutes)
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', req.user.id)
      .single();

    const minBalance = consultant.rate_per_minute * 5;
    if (!wallet || parseFloat(wallet.balance) < minBalance) {
      return res.status(400).json({
        error: `Solde insuffisant. Minimum requis : ${minBalance}€ (5 minutes)`,
      });
    }

    // Créer la session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        client_id: req.user.id,
        consultant_id: consultantId,
        rate_per_minute: consultant.rate_per_minute,
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

    // Calculer la durée et le coût
    const startedAt = new Date(session.started_at);
    const endedAt = new Date();
    const durationSeconds = Math.ceil((endedAt - startedAt) / 1000);
    const durationMinutes = Math.ceil(durationSeconds / 60);
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

    // Débiter le client
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', session.client_id)
      .single();

    if (wallet) {
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
      .select('id, status, started_at, ended_at, duration_seconds, rate_per_minute, total_cost, created_at')
      .eq(column, filterValue)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(sessions.map((s) => ({
      id: s.id,
      status: s.status,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationSeconds: s.duration_seconds,
      ratePerMinute: s.rate_per_minute,
      totalCost: s.total_cost,
      createdAt: s.created_at,
    })));
  } catch (err) {
    console.error('Erreur historique sessions:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
