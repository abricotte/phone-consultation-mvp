const express = require('express');
const twilio = require('../config/twilio');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { VoiceResponse } = require('twilio').twiml;

const router = express.Router();

// Normaliser un numéro de téléphone au format international
function normalizePhone(phone) {
  if (!phone) return phone;
  // Supprimer les espaces, tirets, points
  let cleaned = phone.replace(/[\s\-\.]/g, '');
  // Convertir format français 06/07 → +336/+337
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+33' + cleaned.substring(1);
  }
  // Ajouter + si manquant pour les numéros internationaux
  if (cleaned.startsWith('33') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

// POST /api/calls/initiate - Lancer un appel vers le consultant
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'ID de session requis' });
    }

    // Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, consultants(user_id)')
      .eq('id', sessionId)
      .eq('client_id', req.user.id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ error: 'Cette session ne peut pas être démarrée' });
    }

    // Récupérer le téléphone du consultant
    const { data: consultantUser } = await supabase
      .from('users')
      .select('phone')
      .eq('id', session.consultants.user_id)
      .single();

    if (!consultantUser?.phone) {
      return res.status(400).json({ error: 'Le consultant n\'a pas de numéro de téléphone' });
    }

    // Récupérer le téléphone du client
    const { data: clientUser } = await supabase
      .from('users')
      .select('phone')
      .eq('id', req.user.id)
      .single();

    if (!clientUser?.phone) {
      return res.status(400).json({ error: 'Vous devez renseigner votre numéro de téléphone' });
    }

    // Créer l'appel via Twilio
    // On appelle d'abord le client, puis on connecte au consultant
    if (!twilio) {
      return res.status(503).json({ error: 'Twilio non configuré. Vérifiez TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN.' });
    }

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

    const clientPhone = normalizePhone(clientUser.phone);
    const consultantPhone = normalizePhone(consultantUser.phone);

    const call = await twilio.calls.create({
      to: clientPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${backendUrl}/api/calls/twiml/connect?consultantPhone=${encodeURIComponent(consultantPhone)}&sessionId=${sessionId}`,
      statusCallback: `${backendUrl}/api/calls/status`,
      statusCallbackEvent: ['initiated', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });

    // Mettre à jour la session avec le SID Twilio
    await supabase
      .from('sessions')
      .update({
        twilio_call_sid: call.sid,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    res.json({
      message: 'Appel en cours de connexion...',
      callSid: call.sid,
      sessionId,
    });
  } catch (err) {
    console.error('Erreur initiation appel:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du lancement de l\'appel' });
  }
});

// GET /api/calls/twiml/connect - TwiML pour connecter le client au consultant
router.get('/twiml/connect', (req, res) => {
  const { consultantPhone, sessionId } = req.query;

  const response = new VoiceResponse();
  response.say(
    { language: 'fr-FR' },
    'Connexion à votre consultant. Veuillez patienter.'
  );

  const dial = response.dial({
    callerId: process.env.TWILIO_PHONE_NUMBER,
    action: `/api/calls/twiml/completed?sessionId=${sessionId}`,
    method: 'POST',
  });
  dial.number(consultantPhone);

  res.type('text/xml');
  res.send(response.toString());
});

// POST /api/calls/twiml/completed - TwiML quand l'appel se termine
router.post('/twiml/completed', async (req, res) => {
  const { sessionId } = req.query;
  const { DialCallDuration } = req.body;

  try {
    const durationSeconds = parseInt(DialCallDuration) || 0;

    // Récupérer la session pour calculer le coût
    const { data: session } = await supabase
      .from('sessions')
      .select('id, client_id, rate_per_minute, started_at')
      .eq('id', sessionId)
      .single();

    if (session) {
      const durationMinutes = Math.ceil(durationSeconds / 60);
      const totalCost = durationMinutes * parseFloat(session.rate_per_minute);

      // Mettre à jour la session
      await supabase
        .from('sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          total_cost: totalCost,
        })
        .eq('id', sessionId);

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
            description: `Consultation téléphonique - ${durationMinutes} min`,
            session_id: sessionId,
          });
      }

      console.log(`Appel terminé : session ${sessionId}, ${durationMinutes} min, ${totalCost}€`);
    }
  } catch (err) {
    console.error('Erreur fin appel:', err);
  }

  const response = new VoiceResponse();
  response.say({ language: 'fr-FR' }, 'Consultation terminée. Merci et à bientôt.');
  res.type('text/xml');
  res.send(response.toString());
});

// POST /api/calls/status - Callback statut Twilio
router.post('/status', async (req, res) => {
  const { CallSid, CallStatus } = req.body;

  console.log(`Statut appel ${CallSid}: ${CallStatus}`);

  // Si l'appel échoue ou est annulé, mettre à jour la session
  if (['failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('twilio_call_sid', CallSid)
      .single();

    if (session) {
      await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id);
    }
  }

  res.status(200).send('OK');
});

module.exports = router;
