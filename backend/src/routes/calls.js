const express = require('express');
const twilio = require('../config/twilio');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const twilioSignature = require('../middleware/twilioSignature');
const { verrouillerConsultation, libererConsultation } = require('../config/praticienne');
const { VoiceResponse } = require('twilio').twiml;

const router = express.Router();

// Délai d'avertissement avant la coupure automatique (en secondes)
const WARNING_SECONDS = 2 * 60;

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

    // VERROU ATOMIQUE : disponible → en_consultation. Si la ligne vient
    // d'être prise par une autre cliente, refus propre sans appel.
    const verrou = await verrouillerConsultation(maxSeconds);
    if (!verrou.ok) {
      return res.status(409).json({
        error: 'Elena vient de commencer une consultation. Réessayez dans quelques instants.',
      });
    }

    let clientCall;
    try {
      // Appel du client → rejoint la conférence.
      // timeLimit = coupure matérielle de sécurité (filet de sécurité si le minuteur
      // serveur tombe). La coupure « propre » se fait via la fin de conférence.
      clientCall = await twilio.calls.create({
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
    } catch (twilioErr) {
      // Échec du lancement → libérer immédiatement la praticienne
      await libererConsultation();
      throw twilioErr;
    }

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
router.get('/twiml/join', twilioSignature, (req, res) => {
  const { sessionId, role } = req.query;
  const backendUrl = getBackendUrl();

  const response = new VoiceResponse();
  response.say(
    { language: 'fr-FR' },
    role === 'consultant'
      ? 'Connexion à votre client. Veuillez patienter.'
      : 'Connexion à votre consultante. Un signal discret vous préviendra deux minutes avant la fin de la consultation. Veuillez patienter.'
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
router.post('/conference-status', twilioSignature, async (req, res) => {
  // Répondre immédiatement à Twilio, traiter ensuite
  res.status(200).send('OK');

  const sessionId = req.query.sessionId;
  const event = req.body.StatusCallbackEvent;
  const conferenceSid = req.body.ConferenceSid;

  try {
    if (event === 'participant-join') {
      if (!twilio || !conferenceSid) return;

      const participants = await twilio
        .conferences(conferenceSid)
        .participants.list({ limit: 5 });

      const { data: session } = await supabase
        .from('sessions')
        .select('id, type, started_at, rate_per_minute, client_id, forfait_minutes, telephone_cliente, cliente_call_sid')
        .eq('id', sessionId)
        .single();

      if (!session) return;

      // FORFAIT MANUEL : Elena rejoint en premier → on compose alors la
      // cliente. Garde anti-double-appel : cliente_call_sid posé de façon
      // conditionnelle en base AVANT l'appel.
      if (
        session.type === 'forfait_manuel' &&
        participants.length === 1 &&
        !session.cliente_call_sid &&
        session.telephone_cliente
      ) {
        const { data: garde } = await supabase
          .from('sessions')
          .update({ cliente_call_sid: 'en-cours' })
          .eq('id', sessionId)
          .is('cliente_call_sid', null)
          .select('id');

        if (!garde || garde.length === 0) return; // déjà pris en charge

        const backendUrl = getBackendUrl();
        const clienteCall = await twilio.calls.create({
          to: session.telephone_cliente,
          from: process.env.TWILIO_PHONE_NUMBER,
          url: `${backendUrl}/api/calls/twiml/join?sessionId=${sessionId}&role=client`,
          timeLimit: session.forfait_minutes * 60 + 60, // filet de sécurité
          statusCallback: `${backendUrl}/api/calls/status`,
          statusCallbackEvent: ['failed', 'busy', 'no-answer', 'canceled', 'completed'],
          statusCallbackMethod: 'POST',
        });

        await supabase
          .from('sessions')
          .update({ cliente_call_sid: clienteCall.sid })
          .eq('id', sessionId);

        console.log(`Forfait manuel ${sessionId} : Elena en ligne, cliente composée (${clienteCall.sid})`);
        return;
      }

      // Démarrer le chrono quand les DEUX participants sont présents
      if (participants.length < 2) return;
      if (session.started_at) return; // déjà démarré (évite les doublons)

      await supabase
        .from('sessions')
        .update({ started_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Durée max : forfait fixe, ou solde du wallet pour la minute
      let maxSeconds;
      if (session.type === 'forfait_manuel' || session.type === 'forfait') {
        maxSeconds = (session.forfait_minutes || 0) * 60;
        // Coupure PROPRE du forfait : fin de conférence à l'heure exacte
        setTimeout(() => endConference(conferenceSid), maxSeconds * 1000);
      } else {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', session.client_id)
          .single();

        const rate = parseFloat(session.rate_per_minute);
        const balance = wallet ? parseFloat(wallet.balance) : 0;
        maxSeconds = Math.floor(balance / rate) * 60;
      }

      const warnInSeconds = maxSeconds - WARNING_SECONDS;
      if (warnInSeconds > 0) {
        setTimeout(() => playWarning(conferenceSid), warnInSeconds * 1000);
        console.log(`Avertissement programmé dans ${warnInSeconds}s (conférence ${conferenceSid})`);
      }
      return;
    }

    // Fin de conférence → facturation (un seul point) + libération du verrou
    if (event === 'conference-end') {
      await finalizeSession(sessionId);
    }
  } catch (err) {
    console.error('Erreur conference-status:', err);
  }
});

// Termine proprement une conférence (coupure à l'heure exacte du forfait)
async function endConference(conferenceSid) {
  try {
    if (!twilio) return;
    await twilio.conferences(conferenceSid).update({ status: 'completed' });
    console.log(`Conférence ${conferenceSid} terminée (fin de forfait)`);
  } catch (err) {
    // La conférence peut être déjà terminée — le timeLimit reste le filet
    console.warn(`Fin de conférence ${conferenceSid} : ${err.message}`);
  }
}

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

    console.log(`Avertissement 2 min joué (conférence ${conferenceSid})`);
  } catch (err) {
    console.error('Erreur lecture avertissement:', err);
  }
}

// GET /api/calls/twiml/warning - Bip + message « il vous reste 2 minutes »
router.get('/twiml/warning', twilioSignature, (req, res) => {
  const response = new VoiceResponse();
  // Bip sonore via tonalité DTMF. Pour un vrai « bip » audio, remplacer par :
  //   response.play('https://<votre-domaine>/beep.mp3');
  response.play({ digits: '99' });
  response.say(
    { language: 'fr-FR' },
    'Attention, il vous reste environ deux minutes de communication.'
  );
  res.type('text/xml');
  res.send(response.toString());
});

// Calcule la durée, met à jour la session, débite si nécessaire,
// et LIBÈRE la praticienne (idempotent)
async function finalizeSession(sessionId) {
  const { data: session } = await supabase
    .from('sessions')
    .select('id, type, status, started_at, rate_per_minute, client_id, montant_paye')
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
    await libererConsultation();
    return;
  }

  const startedAt = new Date(session.started_at);
  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.ceil((endedAt - startedAt) / 1000));
  const durationMinutes = Math.ceil(durationSeconds / 60);

  // Forfait manuel : montant déjà encaissé via Calendly → pas de débit,
  // total_cost = montant du forfait (pour la vue du jour)
  const totalCost =
    session.type === 'forfait_manuel'
      ? parseFloat(session.montant_paye || 0)
      : durationMinutes * parseFloat(session.rate_per_minute);

  await supabase
    .from('sessions')
    .update({
      status: 'completed',
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
      total_cost: totalCost,
    })
    .eq('id', sessionId);

  // Débit du wallet : uniquement pour la consultation à la minute
  if (session.type !== 'forfait_manuel' && session.client_id) {
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
  }

  // Retour au statut antérieur du toggle (en_consultation → disponible/hors_ligne)
  await libererConsultation();

  console.log(`Appel terminé : session ${sessionId} (${session.type}), ${durationMinutes} min, ${totalCost}€`);
}

// POST /api/calls/status - Callback statut des appels individuels (Twilio)
router.post('/status', twilioSignature, async (req, res) => {
  res.status(200).send('OK');

  const { CallSid, CallStatus } = req.body;
  console.log(`Statut appel ${CallSid}: ${CallStatus}`);

  // Si l'appel échoue/n'aboutit pas, annuler la session et libérer Elena
  if (['failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
    const { data: session } = await supabase
      .from('sessions')
      .select('id, status')
      .or(`twilio_call_sid.eq.${CallSid},cliente_call_sid.eq.${CallSid}`)
      .single();

    if (session && session.status !== 'completed') {
      await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id);
      await libererConsultation();
    }
  }
});

module.exports = router;
