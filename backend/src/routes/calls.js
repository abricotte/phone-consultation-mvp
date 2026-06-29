const express = require('express');
const twilio = require('../config/twilio');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { VoiceResponse } = require('twilio').twiml;

const router = express.Router();

// Délai d'avertissement avant la coupure automatique (en secondes)
const WARNING_SECONDS = 5 * 60;

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

// URL publique du backend (pour les callbacks Twilio)
function getBackendUrl() {
  return process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
}

// Nom déterministe de la conférence à partir de l'ID de session
function conferenceName(sessionId) {
  return `consult-${sessionId}`;
}

// POST /api/calls/initiate - Lancer la mise en relation client ↔ consultant
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

    if (!twilio) {
      return res.status(503).json({ error: 'Twilio non configuré. Vérifiez TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN.' });
    }

    // Calculer la durée maximale autorisée selon le solde du client
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', req.user.id)
      .single();

    const rate = parseFloat(session.rate_per_minute);
    const balance = wallet ? parseFloat(wallet.balance) : 0;
    const maxMinutes = Math.floor(balance / rate);

    if (maxMinutes < 1) {
      return res.status(400).json({ error: 'Solde insuffisant pour démarrer un appel.' });
    }

    const maxSeconds = maxMinutes * 60;
    const backendUrl = getBackendUrl();
    const clientPhone = normalizePhone(clientUser.phone);
    const consultantPhone = normalizePhone(consultantUser.phone);
    const confName = conferenceName(sessionId);

    // Appel du client → rejoint la conférence.
    // timeLimit = coupure matérielle de sécurité (filet de sécurité si le minuteur
    // serveur tombe). La coupure « propre » se fait via la fin de conférence.
    const clientCall = await twilio.calls.create({
      to: clientPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${backendUrl}/api/calls/twiml/join?sessionId=${sessionId}&role=client`,
      timeLimit: maxSeconds,
      statusCallback: `${backendUrl}/api/calls/status`,
      statusCallbackEvent: ['failed', 'busy', 'no-answer', 'canceled', 'completed'],
      statusCallbackMethod: 'POST',
    });

    // Appel du consultant → rejoint la même conférence
    await twilio.calls.create({
      to: consultantPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${backendUrl}/api/calls/twiml/join?sessionId=${sessionId}&role=consultant`,
      timeLimit: maxSeconds,
    });

    // started_at sera fixé quand les DEUX participants sont connectés (cf. conference-status)
    await supabase
      .from('sessions')
      .update({
        twilio_call_sid: clientCall.sid,
        status: 'active',
      })
      .eq('id', sessionId);

    res.json({
      message: 'Appel en cours de connexion...',
      callSid: clientCall.sid,
      sessionId,
      maxMinutes,
    });
  } catch (err) {
    console.error('Erreur initiation appel:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du lancement de l\'appel' });
  }
});

// GET /api/calls/twiml/join - Fait rejoindre la conférence au participant
router.get('/twiml/join', (req, res) => {
  const { sessionId, role } = req.query;
  const backendUrl = getBackendUrl();

  const response = new VoiceResponse();
  response.say(
    { language: 'fr-FR' },
    role === 'consultant'
      ? 'Connexion à votre client. Veuillez patienter.'
      : 'Connexion à votre consultant. Veuillez patienter.'
  );

  const dial = response.dial({ callerId: process.env.TWILIO_PHONE_NUMBER });
  dial.conference(
    {
      startConferenceOnEnter: true,
      // Si l'un des deux raccroche, la conférence se termine pour les deux
      endConferenceOnExit: true,
      // Silence (pas de musique d'attente) tant que le second n'a pas rejoint
      waitUrl: '',
      statusCallback: `${backendUrl}/api/calls/conference-status?sessionId=${sessionId}`,
      statusCallbackEvent: 'join leave end',
      statusCallbackMethod: 'POST',
    },
    conferenceName(sessionId)
  );

  res.type('text/xml');
  res.send(response.toString());
});

// POST /api/calls/conference-status - Événements de la conférence (Twilio)
router.post('/conference-status', async (req, res) => {
  // Répondre immédiatement à Twilio, traiter ensuite
  res.status(200).send('OK');

  const sessionId = req.query.sessionId;
  const event = req.body.StatusCallbackEvent;
  const conferenceSid = req.body.ConferenceSid;

  try {
    // Démarrer le chrono quand les DEUX participants sont présents
    if (event === 'participant-join') {
      if (!twilio || !conferenceSid) return;

      const participants = await twilio
        .conferences(conferenceSid)
        .participants.list({ limit: 5 });

      if (participants.length < 2) return;

      const { data: session } = await supabase
        .from('sessions')
        .select('id, started_at, rate_per_minute, client_id')
        .eq('id', sessionId)
        .single();

      // Déjà démarré → ne pas re-programmer (évite les doublons)
      if (!session || session.started_at) return;

      await supabase
        .from('sessions')
        .update({ started_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Programmer le bip d'avertissement avant la coupure
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.client_id)
        .single();

      const rate = parseFloat(session.rate_per_minute);
      const balance = wallet ? parseFloat(wallet.balance) : 0;
      const maxSeconds = Math.floor(balance / rate) * 60;
      const warnInSeconds = maxSeconds - WARNING_SECONDS;

      if (warnInSeconds > 0) {
        setTimeout(() => playWarning(conferenceSid), warnInSeconds * 1000);
        console.log(`Avertissement programmé dans ${warnInSeconds}s (conférence ${conferenceSid})`);
      }
      return;
    }

    // Fin de conférence → facturation (un seul point de débit)
    if (event === 'conference-end') {
      await finalizeSession(sessionId);
    }
  } catch (err) {
    console.error('Erreur conference-status:', err);
  }
});

// Joue le bip + message d'avertissement à TOUS les participants de la conférence
async function playWarning(conferenceSid) {
  try {
    if (!twilio) return;

    const backendUrl = getBackendUrl();
    const participants = await twilio
      .conferences(conferenceSid)
      .participants.list({ limit: 5 });

    await Promise.all(
      participants.map((p) =>
        twilio
          .conferences(conferenceSid)
          .participants(p.callSid)
          .update({
            announceUrl: `${backendUrl}/api/calls/twiml/warning`,
            announceMethod: 'GET',
          })
      )
    );

    console.log(`Avertissement 5 min joué (conférence ${conferenceSid})`);
  } catch (err) {
    console.error('Erreur lecture avertissement:', err);
  }
}

// GET /api/calls/twiml/warning - Bip + message « il vous reste 5 minutes »
router.get('/twiml/warning', (req, res) => {
  const response = new VoiceResponse();
  // Bip sonore via tonalité DTMF. Pour un vrai « bip » audio, remplacer par :
  //   response.play('https://<votre-domaine>/beep.mp3');
  response.play({ digits: '99' });
  response.say(
    { language: 'fr-FR' },
    'Attention, il vous reste environ cinq minutes de communication.'
  );
  res.type('text/xml');
  res.send(response.toString());
});

// Calcule la durée, met à jour la session et débite le client (idempotent)
async function finalizeSession(sessionId) {
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, started_at, rate_per_minute, client_id')
    .eq('id', sessionId)
    .single();

  if (!session) return;

  // Déjà traité → on s'arrête (Twilio peut renvoyer l'événement plusieurs fois)
  if (session.status === 'completed' || session.status === 'cancelled') return;

  // Les deux participants ne se sont jamais connectés → aucune facturation
  if (!session.started_at) {
    await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId);
    return;
  }

  const startedAt = new Date(session.started_at);
  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.ceil((endedAt - startedAt) / 1000));
  const durationMinutes = Math.ceil(durationSeconds / 60);
  const totalCost = durationMinutes * parseFloat(session.rate_per_minute);

  await supabase
    .from('sessions')
    .update({
      status: 'completed',
      ended_at: endedAt.toISOString(),
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

// POST /api/calls/status - Callback statut des appels individuels (Twilio)
router.post('/status', async (req, res) => {
  res.status(200).send('OK');

  const { CallSid, CallStatus } = req.body;
  console.log(`Statut appel ${CallSid}: ${CallStatus}`);

  // Si l'appel du client échoue/n'aboutit pas, annuler la session
  if (['failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
    const { data: session } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('twilio_call_sid', CallSid)
      .single();

    if (session && session.status !== 'completed') {
      await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id);
    }
  }
});

module.exports = router;
