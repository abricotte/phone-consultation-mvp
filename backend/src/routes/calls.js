const express = require('express');
const twilio = require('../config/twilio');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const twilioSignature = require('../middleware/twilioSignature');
const { verrouillerConsultation, libererConsultation, getPraticienne } = require('../config/praticienne');
const { VoiceResponse } = require('twilio').twiml;
// Source unique de normalisation (cf. utils/telephone.js)
const { normaliser: normalizePhone, masquer: masquerNumeroTel } = require('../utils/telephone');
// Numéros bloqués (cf. utils/blocage.js)
const { estBloque } = require('../utils/blocage');

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

// Masquage des numéros dans les journaux : même source que le reste
const masquerNumero = masquerNumeroTel;

// Consultation Immédiate : on garde en mémoire le SID de l'appel d'Elena
// pour pouvoir le raccrocher si le téléphone de la cliente tombe sur
// répondeur (AMD). Backend mono-instance — cohérent avec les setTimeout
// déjà utilisés ici (handleMiseEnRelationTimeout, playWarning…).
const consultantCallSids = new Map();

// AnsweredBy renvoyé par la détection de répondeur Twilio (AMD).
// 'human' / 'unknown' → on connecte. 'machine_*' / 'fax' → répondeur.
function estRepondeur(answeredBy) {
  return typeof answeredBy === 'string' && /^(machine|fax)/i.test(answeredBy);
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

    // La praticienne ne peut pas se consulter elle-même : si la cliente
    // connectée EST la praticienne, les deux jambes composeraient le même
    // numéro (une seule et même fiche utilisateur), et modifier son numéro
    // dans "Mon compte" changerait aussi celui de sa ligne professionnelle.
    if (session.consultants.user_id === req.user.id) {
      return res.status(400).json({
        error:
          "Vous êtes connectée avec le compte de la praticienne : impossible de s'appeler soi-même. Pour tester, utilisez un compte cliente distinct.",
      });
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

    // Twilio refuse d'appeler un numéro depuis lui-même : si le numéro
    // enregistré pour la praticienne est le numéro Twilio de la ligne,
    // sa jambe échoue silencieusement (la cliente sonne, elle non).
    const numeroTwilio = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
    if (consultantPhone && consultantPhone === numeroTwilio) {
      console.error(
        `Configuration invalide : le numéro de la praticienne (${masquerNumero(consultantPhone)}) est le numéro Twilio de la ligne. Renseignez son numéro personnel.`
      );
      return res.status(500).json({
        error:
          "Configuration téléphonique incorrecte : le numéro de la praticienne est identique au numéro de la ligne. L'appel ne peut pas aboutir.",
      });
    }
    if (consultantPhone && consultantPhone === clientPhone) {
      return res.status(400).json({
        error:
          'Votre numéro est identique à celui de la praticienne : la mise en relation est impossible.',
      });
    }

    // NUMÉRO BLOQUÉ : refus AVANT le verrou et avant tout appel Twilio.
    // Le message reste neutre — inutile d'informer un harceleur qu'il a
    // été identifié comme tel, et une erreur de blocage ne doit pas
    // humilier une cliente légitime.
    if ((await estBloque(clientPhone)).bloque) {
      console.log(`Appel refusé : numéro bloqué ${masquerNumeroTel(clientPhone)}`);
      return res.status(403).json({
        error:
          "La mise en relation n'est pas possible depuis ce numéro. Contactez Elena par écrit si vous pensez qu'il s'agit d'une erreur.",
      });
    }

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
        method: 'GET', // /twiml/join est une route GET (défaut Twilio = POST)
        timeLimit: maxSeconds,
        // Détection de répondeur : Twilio ajoute AnsweredBy à la requête
        // /twiml/join. Si un répondeur/fax décroche, on raccroche sans
        // facturer (cf. /twiml/join). 'Enable' répond dès human vs machine.
        machineDetection: 'Enable',
        machineDetectionTimeout: 15,
        statusCallback: `${backendUrl}/api/calls/status`,
        statusCallbackEvent: ['failed', 'busy', 'no-answer', 'canceled', 'completed'],
        statusCallbackMethod: 'POST',
      });

      // Appel du consultant → rejoint la même conférence.
      // statusCallback INDISPENSABLE : sans lui, un échec de cette jambe
      // (numéro invalide, occupé, refus opérateur) passait totalement
      // inaperçu — la cliente sonnait, la praticienne jamais, et aucun
      // journal ne permettait de le voir.
      const consultantCall = await twilio.calls.create({
        to: consultantPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${backendUrl}/api/calls/twiml/join?sessionId=${sessionId}&role=consultant`,
        method: 'GET', // idem
        timeLimit: maxSeconds,
        statusCallback: `${backendUrl}/api/calls/status`,
        statusCallbackEvent: ['failed', 'busy', 'no-answer', 'canceled', 'completed'],
        statusCallbackMethod: 'POST',
      });
      // Mémorisé pour raccrocher la jambe d'Elena si la cliente tombe sur répondeur
      consultantCallSids.set(sessionId, consultantCall.sid);
      console.log(
        `Appels lancés (session ${sessionId}) : cliente ${masquerNumero(clientPhone)} [${clientCall.sid}] · praticienne ${masquerNumero(consultantPhone)} [${consultantCall.sid}]`
      );
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

  // RÉPONDEUR DÉTECTÉ (jambe cliente) : ne PAS rejoindre la conférence, ne
  // PAS facturer. On raccroche cette jambe et on annule la mise en relation
  // (verrou libéré, session annulée, appel d'Elena raccroché). Le
  // débit n'a lieu que si started_at est posé, ce qui n'arrivera jamais ici.
  if (role === 'client' && estRepondeur(req.query.AnsweredBy)) {
    console.log(`Répondeur détecté (session ${sessionId}, AnsweredBy=${req.query.AnsweredBy}) — aucune facturation`);
    annulerPourRepondeur(sessionId).catch((err) =>
      console.error('Erreur annulation répondeur:', err)
    );
    const rep = new VoiceResponse();
    rep.hangup();
    res.type('text/xml');
    return res.send(rep.toString());
  }

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
          method: 'GET', // /twiml/join est une route GET (défaut Twilio = POST)
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

    consultantCallSids.delete(sessionId);

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

// Consultation Immédiate : le téléphone de la cliente est tombé sur
// répondeur. On annule proprement SANS aucun débit (started_at jamais posé)
// et on raccroche la jambe d'Elena pour ne pas la laisser en attente.
// Idempotent : sans effet si la session a déjà démarré/été traitée.
async function annulerPourRepondeur(sessionId) {
  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('id, status, started_at')
      .eq('id', sessionId)
      .single();

    // Déjà connectés ou déjà clôturés → ne rien faire
    if (!session || session.started_at || session.status !== 'active') return;

    await libererConsultation(); // ne lève jamais

    await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId);

    // Raccrocher la jambe d'Elena (en sonnerie → 'canceled', en ligne → 'completed')
    const consultantSid = consultantCallSids.get(sessionId);
    if (consultantSid && twilio) {
      await twilio
        .calls(consultantSid)
        .update({ status: 'completed' })
        .catch(() =>
          twilio.calls(consultantSid).update({ status: 'canceled' }).catch(() => {})
        );
    }
  } catch (err) {
    console.error('Erreur annulerPourRepondeur:', err);
  } finally {
    consultantCallSids.delete(sessionId);
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

// GET /api/calls/twiml/verification - Énonce le code de vérification du
// nouveau numéro de la praticienne. Le code est lu en base à partir de
// l'identifiant de vérification : il ne transite jamais dans l'URL.
router.get('/twiml/verification', twilioSignature, async (req, res) => {
  const response = new VoiceResponse();

  try {
    const { data: verif } = await supabase
      .from('verifications_numero')
      .select('code, expire_le')
      .eq('id', req.query.id)
      .maybeSingle();

    if (!verif || new Date(verif.expire_le) < new Date()) {
      response.say(
        { language: 'fr-FR' },
        "Cette vérification n'est plus valide. Relancez-la depuis votre cabinet."
      );
    } else {
      // Chiffre par chiffre, avec des pauses : un code dicté trop vite
      // au téléphone est inutilisable.
      const chiffres = verif.code.split('').join(', ');
      response.pause({ length: 1 });
      response.say(
        { language: 'fr-FR' },
        'Bonjour Elena. Voici le code de vérification de votre nouveau numéro.'
      );
      for (let i = 0; i < 3; i++) {
        response.pause({ length: 1 });
        response.say({ language: 'fr-FR' }, chiffres);
      }
      response.pause({ length: 1 });
      response.say(
        { language: 'fr-FR' },
        'Saisissez ce code dans votre cabinet pour confirmer. À bientôt.'
      );
    }
  } catch (err) {
    console.error('Erreur TwiML vérification:', err);
    response.say({ language: 'fr-FR' }, 'Une erreur est survenue. Réessayez.');
  }

  response.hangup();
  res.type('text/xml');
  res.send(response.toString());
});

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

  // Pré-vérification bon marché : évite de travailler pour rien. Elle ne
  // SUFFIT PAS à empêcher un double débit — cf. la prise atomique plus bas.
  if (session.status === 'completed' || session.status === 'cancelled') return;

  // Statuts depuis lesquels une session peut encore être clôturée. Sert de
  // condition à la prise atomique : la base n'accepte la transition qu'une
  // seule fois, quel que soit le nombre de notifications reçues.
  const STATUTS_OUVERTS = ['pending', 'active'];

  // Les deux participants ne se sont jamais connectés → aucune facturation
  if (!session.started_at) {
    const { data: annulees } = await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId)
      .in('status', STATUTS_OUVERTS)
      .select('id');

    // Une autre notification a déjà annulé : elle libère le verrou, pas nous.
    if (!annulees || annulees.length === 0) return;

    await libererConsultation();
    consultantCallSids.delete(sessionId);
    return;
  }

  const startedAt = new Date(session.started_at);
  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.ceil((endedAt - startedAt) / 1000));

  // FRANCHISE DE CONNEXION (consultation à la minute) : un appel qui
  // saute en dessous de 60 s n'est PAS facturé — coupure réseau, faux
  // départ, raccrochage immédiat. Automatique et sans litige, là où les
  // plateformes classiques renvoient vers le service client. Au-delà,
  // chaque minute entamée est due (règle affichée à la cliente).
  const FRANCHISE_SECONDES = 60;
  const sousFranchise =
    session.type !== 'forfait_manuel' && durationSeconds < FRANCHISE_SECONDES;
  const durationMinutes = sousFranchise ? 0 : Math.ceil(durationSeconds / 60);

  // Forfait manuel : montant déjà encaissé via Calendly → pas de débit,
  // total_cost = montant du forfait (pour la vue du jour)
  const totalCost =
    session.type === 'forfait_manuel'
      ? parseFloat(session.montant_paye || 0)
      : durationMinutes * parseFloat(session.rate_per_minute);

  if (sousFranchise) {
    console.log(
      `Session ${sessionId} : ${durationSeconds}s < ${FRANCHISE_SECONDES}s de franchise — aucune facturation`
    );
  }

  // La facturation ne doit JAMAIS empêcher la libération du verrou : si une
  // erreur survient ici, le finally garantit quand même le retour à
  // "disponible" (sinon la praticienne resterait bloquée en consultation).
  // Vrai si la base nous a explicitement répondu « quelqu'un d'autre a déjà
  // clôturé ». Dans ce seul cas nous ne libérons pas le verrou : le gagnant
  // s'en charge. En cas d'erreur, on libère quand même — mieux vaut un
  // verrou relâché deux fois qu'une praticienne bloquée en consultation.
  let perdu = false;

  try {
    // PRISE ATOMIQUE — la seule protection réelle contre le double débit.
    // Twilio notifie la fin de l'appel pour CHAQUE jambe (cliente et
    // praticienne), et la conférence notifie de son côté : finalizeSession
    // peut donc s'exécuter trois fois en parallèle. Une simple lecture du
    // statut suivie d'une écriture ne protège de rien — les trois lisent
    // « active » avant que la première n'écrive, et les trois débitent.
    // Ici la condition de statut fait partie de l'UPDATE : PostgreSQL
    // verrouille la ligne, et les perdants ne modifient aucune ligne.
    const { data: gagnees } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        total_cost: totalCost,
      })
      .eq('id', sessionId)
      .in('status', STATUTS_OUVERTS)
      .select('id');

    if (!gagnees || gagnees.length === 0) {
      perdu = true;
      console.log(
        `Session ${sessionId} : déjà clôturée par une autre notification Twilio — aucun débit`
      );
      return;
    }

    // Débit du wallet : uniquement pour la consultation à la minute,
    // et seulement s'il y a quelque chose à débiter (franchise = 0 €,
    // pas de ligne de transaction parasite dans l'historique)
    if (session.type !== 'forfait_manuel' && session.client_id && totalCost > 0) {
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

    console.log(`Appel terminé : session ${sessionId} (${session.type}), ${durationMinutes} min, ${totalCost}€`);
  } catch (err) {
    console.error(`finalizeSession : erreur de clôture/facturation (verrou libéré quand même) : ${err.message}`);
  } finally {
    // Retour au statut antérieur du toggle (en_consultation → disponible/hors_ligne)
    if (!perdu) {
      await libererConsultation();
      consultantCallSids.delete(sessionId);
    }
  }
}

// POST /api/calls/status - Callback statut des appels individuels (Twilio)
router.post('/status', twilioSignature, async (req, res) => {
  res.status(200).send('OK');

  const { CallSid, CallStatus } = req.body;
  console.log(`Statut appel ${CallSid}: ${CallStatus}`);

  const echec = ['failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus);
  const fini = CallStatus === 'completed';
  if (!echec && !fini) return;

  const { data: session } = await supabase
    .from('sessions')
    .select('id, status')
    .or(`twilio_call_sid.eq.${CallSid},cliente_call_sid.eq.${CallSid}`)
    .single();

  if (!session) return;

  if (echec) {
    // Appel qui n'aboutit pas : annuler la session et libérer Elena
    if (session.status !== 'completed') {
      await libererConsultation(); // ne lève jamais
      await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id);
    }
  } else if (fini) {
    // Fin NORMALE d'un appel (raccrochage) : chemin de nettoyage de SECOURS,
    // indépendant du callback de fin de conférence (qui peut ne pas aboutir).
    // finalizeSession est idempotent (garde sur le statut) et libère le
    // verrou dans tous les cas. Le callback par appel individuel est
    // beaucoup plus fiable que le statusCallback de conférence.
    await finalizeSession(session.id);
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
    // NUMÉRO BLOQUÉ : raccrochage immédiat et silencieux. Pas de message
    // qui apprendrait au harceleur qu'il a été repéré — et surtout, rien
    // qui remonte jusqu'à Elena. Placé en tête pour qu'aucune évolution
    // ultérieure de cette route (fiche express) ne s'exécute pour lui.
    if ((await estBloque(req.body.From)).bloque) {
      console.log(`Appel entrant bloqué : ${masquerNumeroTel(req.body.From)}`);
      response.reject({ reason: 'busy' });
      res.type('text/xml');
      return res.send(response.toString());
    }

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

// Exposé UNIQUEMENT pour les tests (cf. calls.race.test.js) : la protection
// contre le double débit doit pouvoir être vérifiée sans passer par Twilio.
module.exports.__test__ = { finalizeSession };
