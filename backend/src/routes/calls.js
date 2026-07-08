const express = require('express');
const twilio = require('../config/twilio');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const twilioSignature = require('../middleware/twilioSignature');
const { verrouillerConsultation, libererConsultation, getPraticienne } = require('../config/praticienne');
const { VoiceResponse } = require('twilio').twiml;

const router = express.Router();

// Délai d'avertissement avant la coupure automatique (en secondes)
const WARNING_SECONDS = 2 * 60;

// Consultation Immédiate uniquement : si la mise en relation n'aboutit pas
// (Elena ne rejoint jamais la conférence), on coupe proprement plutôt que
// de laisser la cliente en silence indéfiniment.
const MISE_EN_RELATION_TIMEOUT_SECONDS = 75; // fenêtre demandée : 60-90s
// Cadence du message d'attente : ~7s (parole ~4,4s + pause), volontairement lent
const ATTENTE_PAUSE_SECONDES = 3;
const ATTENTE_REPETITIONS = 12; // couvre largement le timeout, puis auto-boucle via <Redirect>

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

// URL publique du backend (pour les callbacks Twilio).
// Barre oblique finale retirée : l'URL fournie à Twilio doit être propre
// pour que la signature reconstruite côté validation corresponde.
function getBackendUrl() {
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  return base.replace(/\/+$/, '');
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

    // Filet de sécurité : si Elena ne rejoint jamais, on coupe proprement
    // après MISE_EN_RELATION_TIMEOUT_SECONDS plutôt que de laisser la
    // cliente en attente indéfiniment (le waitUrl seul ne suffit pas —
    // Twilio ne termine pas une conférence à un seul participant tout seul).
    setTimeout(
      () => handleMiseEnRelationTimeout(sessionId, clientCall.sid),
      MISE_EN_RELATION_TIMEOUT_SECONDS * 1000
    );

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
      ? 'Connexion à votre client.'
      // "Veuillez patienter" retiré ici : le message d'attente qui suit
      // (waitUrl) prend le relais de ce rôle, pas de redondance.
      : 'Connexion à votre consultante. Un signal discret vous préviendra deux minutes avant la fin de la consultation.'
  );

  const dial = response.dial({ callerId: process.env.TWILIO_PHONE_NUMBER });
  dial.conference(
    {
      startConferenceOnEnter: true,
      // Si l'un des deux raccroche, la conférence se termine pour les deux
      endConferenceOnExit: true,
      // Message vocal rassurant en boucle tant que l'autre n'a pas rejoint
      // (remplace le silence — voir /twiml/attente)
      waitUrl: `${backendUrl}/api/calls/twiml/attente?role=${role}`,
      waitMethod: 'GET',
      statusCallback: `${backendUrl}/api/calls/conference-status?sessionId=${sessionId}`,
      statusCallbackEvent: 'join leave end',
      statusCallbackMethod: 'POST',
    },
    conferenceName(sessionId)
  );

  res.type('text/xml');
  res.send(response.toString());
});

// GET /api/calls/twiml/attente - Message d'attente en boucle (remplace le
// silence tant que l'autre participant n'a pas rejoint la conférence).
// Extensible : si praticiennes.messages_vocaux.attente est configuré (URL
// d'un fichier audio — voix d'Elena, éventuellement mixée à une nappe
// sonore douce), on le joue en boucle. Sinon, repli en TTS français.
router.get('/twiml/attente', twilioSignature, async (req, res) => {
  const { role } = req.query;
  const response = new VoiceResponse();

  try {
    const p = await getPraticienne();
    const audioUrl = p.messages_vocaux?.attente;

    if (audioUrl) {
      // Fichier unique en boucle infinie — peut déjà contenir une ambiance
      // sonore mixée par la praticienne, sans aucun changement de code ici.
      response.play({ loop: 0 }, audioUrl);
    } else {
      const message =
        role === 'consultant'
          ? 'Connexion en cours. Merci de patienter.'
          : 'Elena arrive dans un instant. Restez en ligne, elle se connecte à vous.';

      for (let i = 0; i < ATTENTE_REPETITIONS; i++) {
        response.say({ language: 'fr-FR' }, message);
        response.pause({ length: ATTENTE_PAUSE_SECONDES });
      }
      // Filet de sécurité : si les répétitions s'épuisent avant que l'autre
      // participant rejoigne, on se redemande à soi-même pour continuer
      // plutôt que de laisser Twilio raccrocher.
      response.redirect({ method: 'GET' }, `${getBackendUrl()}/api/calls/twiml/attente?role=${role || ''}`);
    }
  } catch (err) {
    console.error('Erreur message attente:', err);
    response.pause({ length: ATTENTE_PAUSE_SECONDES });
  }

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

// Consultation Immédiate : si Elena n'a jamais rejoint la conférence dans
// le délai imparti, on redirige l'appel de la cliente vers un message de
// fin propre plutôt que de la laisser en attente indéfiniment. Idempotent :
// sans effet si la session a déjà démarré ou déjà été traitée entre-temps.
async function handleMiseEnRelationTimeout(sessionId, clientCallSid) {
  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('id, status, started_at')
      .eq('id', sessionId)
      .single();

    // Déjà connectés, ou déjà terminée/annulée par un autre chemin → rien à faire
    if (!session || session.started_at || session.status !== 'active') return;

    console.log(`Timeout mise en relation : session ${sessionId} — Elena n'a pas rejoint à temps`);

    // Verrou d'abord (le plus critique), annulation ensuite.
    // AUCUN débit n'a lieu ici : le wallet n'est jamais touché tant que
    // finalizeSession() n'a pas vu started_at posé (cf. plus bas).
    await libererConsultation(); // ne lève jamais

    await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId);

    if (!twilio) return;

    const backendUrl = getBackendUrl();
    await twilio
      .calls(clientCallSid)
      .update({ url: `${backendUrl}/api/calls/twiml/timeout`, method: 'POST' })
      .catch((err) =>
        console.warn(`Redirection timeout impossible (appel déjà terminé ?) : ${err.message}`)
      );
  } catch (err) {
    console.error('Erreur timeout mise en relation:', err);
  }
}

// POST /api/calls/twiml/timeout - Message de fin quand Elena n'a jamais
// rejoint (aucun débit — le message le confirme explicitement à la cliente)
router.post('/twiml/timeout', twilioSignature, (req, res) => {
  const response = new VoiceResponse();
  response.say(
    { language: 'fr-FR' },
    "Elena n'est pas disponible pour le moment. Vous n'avez pas été débitée. Réessayez dans quelques instants."
  );
  response.hangup();
  res.type('text/xml');
  res.send(response.toString());
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
      // Verrou d'abord (le plus critique), annulation ensuite
      await libererConsultation(); // ne lève jamais
      await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id);
    }
  }
});

// POST /api/calls/twiml/inbound - Quelqu'un compose directement le numéro
// Twilio (ex. une cliente qui l'a enregistré et le rappelle). Ce numéro ne
// sert qu'à ÉMETTRE des appels sortants déclenchés par la plateforme — un
// appel entrant reçoit donc un message poli plutôt qu'une erreur Twilio.
// Volontairement SANS ambiguïté : ne laisse jamais croire à une mise en
// relation en cours (pas de "patientez", pas de menu, raccrochage direct
// après le message). Extensible via praticiennes.messages_vocaux.inbound
// (URL audio) — voix d'Elena plus tard, sans changement de code.
router.post('/twiml/inbound', twilioSignature, async (req, res) => {
  const response = new VoiceResponse();

  try {
    const p = await getPraticienne();
    const audioUrl = p.messages_vocaux?.inbound;

    if (audioUrl) {
      response.play({}, audioUrl);
    } else {
      response.say(
        { language: 'fr-FR' },
        "Bonjour, vous êtes bien sur la ligne d'Elena Wolska. Pour réserver ou lancer une consultation, rendez-vous sur elena-wolska.com. Merci et à très bientôt."
      );
    }
  } catch (err) {
    console.error('Erreur message inbound:', err);
    response.say(
      { language: 'fr-FR' },
      "Bonjour, vous êtes bien sur la ligne d'Elena Wolska. Pour réserver ou lancer une consultation, rendez-vous sur elena-wolska.com. Merci et à très bientôt."
    );
  }

  response.hangup();
  res.type('text/xml');
  res.send(response.toString());
});

module.exports = router;
