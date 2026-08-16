const express = require('express');
const supabase = require('../config/supabase');
const twilio = require('../config/twilio');
const authMiddleware = require('../middleware/auth');
const {
  getPraticienne,
  getTarifs,
  getStatutEnLigne,
  verrouillerConsultation,
  libererConsultation,
  clearCache,
} = require('../config/praticienne');

const router = express.Router();

// Source unique de normalisation (cf. utils/telephone.js)
const {
  normaliser: normalizePhone,
  estMobileFrancais: estNumeroFrValide,
  memeNumero,
} = require('../utils/telephone');

// Numéros bloqués (cf. utils/blocage.js)
const { preparerBlocage } = require('../utils/blocage');

// Réglages de pilotage — bornés côté serveur (cf. utils/reglages.js)
const { borner: bornerReglages } = require('../utils/reglages');

// Garde-fous tarifaires — le serveur fait foi (cf. utils/tarifs.js)
const { verifierPrixMinute, verifierForfait } = require('../utils/tarifs');

// Réservé à la praticienne (rôle consultant) et aux admins
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'consultant') {
    return res.status(403).json({ error: 'Accès réservé' });
  }
  next();
}

router.use(authMiddleware, adminOnly);


// Purge paresseuse : anonymise les numéros clientes au-delà de la rétention
async function purgerTelephones() {
  try {
    const p = await getPraticienne();
    const jours = p.config_tarifs?.retention_telephone_jours ?? 30;
    const limite = new Date(Date.now() - jours * 24 * 3600 * 1000).toISOString();

    const { data } = await supabase
      .from('sessions')
      .update({ telephone_cliente: null })
      .not('telephone_cliente', 'is', null)
      .lt('created_at', limite)
      .select('id');

    if (data && data.length > 0) {
      console.log(`Purge RGPD : ${data.length} numéro(s) cliente anonymisé(s) (> ${jours} jours)`);
    }
  } catch (err) {
    console.error('Erreur purge téléphones:', err);
  }
}

// Identité de la cliente d'un appel immédiat en cours (RÉSERVÉ à la
// praticienne — cette route est sous adminOnly). Renvoie uniquement le
// prénom et le solde en minutes ; jamais le nom, l'email ni le numéro.
// null s'il n'y a pas d'appel immédiat en cours.
async function appelImmediatEnCours(praticienneId, tarifs) {
  const { data: sess } = await supabase
    .from('sessions')
    .select('id, client_id, started_at')
    .eq('praticienne_id', praticienneId)
    .eq('status', 'active')
    .eq('type', 'minute')
    .not('client_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sess || !sess.client_id) return null;

  const [{ data: user }, { data: wallet }, { data: proches }] = await Promise.all([
    supabase
      .from('users')
      .select('first_name, date_naissance, ascendant')
      .eq('id', sess.client_id)
      .maybeSingle(),
    supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', sess.client_id)
      .eq('praticienne_id', praticienneId)
      .maybeSingle(),
    // "Personnes qui comptent" saisies par la cliente : aide Elena à
    // préparer sa lecture. Usage strictement privé de consultation.
    supabase
      .from('proches')
      .select('prenom, date_naissance, ascendant, lien')
      .eq('client_id', sess.client_id)
      .order('created_at', { ascending: true }),
  ]);

  const soldeCents = wallet ? Math.round(parseFloat(wallet.balance) * 100) : 0;
  const soldeMinutes = Math.floor(soldeCents / tarifs.prixMinuteCents);

  // PENSE-BÊTE D'AVANT-APPEL : sa dernière consultation et les 3
  // dernières notes du carnet, sous les yeux avant même de décrocher.
  const [{ data: derniere }, { data: notes }] = await Promise.all([
    supabase
      .from('sessions')
      .select('started_at')
      .eq('praticienne_id', praticienneId)
      .eq('client_id', sess.client_id)
      .eq('status', 'completed')
      .not('started_at', 'is', null)
      .neq('id', sess.id) // pas la consultation en cours
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('notes_praticienne')
      .select('contenu, a_suivre, echeance, close_le, created_at')
      .eq('praticienne_id', praticienneId)
      .eq('client_id', sess.client_id)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  return {
    clienteId: sess.client_id,
    prenom: user?.first_name || 'Cliente',
    dateNaissance: user?.date_naissance || null,
    ascendant: user?.ascendant || null,
    soldeMinutes,
    connecte: !!sess.started_at, // false = ça sonne, true = en ligne
    // Début de communication : le bandeau affiche un chrono vivant et en
    // déduit le crédit restant (le débit n'a lieu qu'à la fin de l'appel).
    depuis: sess.started_at || null,
    derniereConsultation: derniere?.started_at || null,
    notes: (notes || []).map((n) => ({
      contenu: n.contenu,
      aSuivre: n.a_suivre,
      echeance: n.echeance,
      close: !!n.close_le,
      createdAt: n.created_at,
    })),
    proches: (proches || []).map((p) => ({
      prenom: p.prenom,
      dateNaissance: p.date_naissance,
      ascendant: p.ascendant || null,
      lien: p.lien,
    })),
  };
}

// GET /api/admin/statut - Statut actuel + forfaits + appel immédiat en cours
router.get('/statut', async (req, res) => {
  try {
    const statut = await getStatutEnLigne();
    const p = await getPraticienne();
    const tarifs = await getTarifs();

    // Info cliente seulement si une consultation est en cours
    const appelEnCours =
      statut.statut === 'en_consultation'
        ? await appelImmediatEnCours(p.id, tarifs)
        : null;

    // Diagnostic ligne téléphonique (route adminOnly : visible d'elle seule).
    // C'est CE numéro que Twilio compose pour la joindre — s'il est absent
    // ou identique au numéro de la ligne, l'appel vers elle ne peut aboutir.
    let ligne = { numeroPraticienne: null, numeroLigne: process.env.TWILIO_PHONE_NUMBER || null, probleme: null };
    try {
      const { data: consultant } = await supabase
        .from('consultants')
        .select('user_id')
        .eq('praticienne_id', p.id)
        .limit(1)
        .maybeSingle();

      if (consultant?.user_id) {
        const { data: u } = await supabase
          .from('users')
          .select('phone')
          .eq('id', consultant.user_id)
          .maybeSingle();
        ligne.numeroPraticienne = u?.phone || null;
      }

      if (!ligne.numeroPraticienne) {
        ligne.probleme = 'Aucun numéro enregistré pour la praticienne : elle ne peut pas être appelée.';
      } else if (
        ligne.numeroLigne &&
        ligne.numeroPraticienne.replace(/\D/g, '') === ligne.numeroLigne.replace(/\D/g, '')
      ) {
        ligne.probleme = 'Le numéro de la praticienne est identique au numéro de la ligne : Twilio ne peut pas appeler un numéro depuis lui-même.';
      }
    } catch (e) {
      ligne.probleme = 'Vérification impossible.';
    }

    res.json({
      statut: statut.statut,
      enLigne: statut.enLigne,
      enLigneDepuis: statut.enLigneDepuis,
      retourPrevu: statut.retourPrevu,
      autoOffHeures: p.auto_off_heures || 4,
      forfaits: tarifs.forfaits,
      appelEnCours,
      ligne,
    });
  } catch (err) {
    console.error('Erreur statut admin:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/statut - Toggle disponible / hors_ligne
router.patch('/statut', async (req, res) => {
  try {
    const { enLigne } = req.body;
    if (typeof enLigne !== 'boolean') {
      return res.status(400).json({ error: 'enLigne (booléen) requis' });
    }

    const { statut } = await getStatutEnLigne();
    if (statut === 'en_consultation') {
      return res.status(409).json({
        error: 'Consultation en cours — le statut changera automatiquement à la fin de l\'appel.',
      });
    }

    const p = await getPraticienne();
    const nouveau = enLigne ? 'disponible' : 'hors_ligne';

    const { error } = await supabase
      .from('praticiennes')
      .update({
        statut: nouveau,
        statut_precedent: nouveau,
        statut_en_ligne: enLigne, // legacy, synchronisé
        en_ligne_depuis: enLigne ? new Date().toISOString() : null,
        retour_prevu: null,
      })
      .eq('id', p.id)
      .neq('statut', 'en_consultation'); // jamais écraser un appel en cours

    if (error) throw error;

    clearCache();
    console.log(`Statut praticienne : ${nouveau}`);

    res.json({
      statut: nouveau,
      enLigne,
      enLigneDepuis: enLigne ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error('Erreur toggle statut:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/consultation-minutee - Lancer un forfait manuel
// (rendez-vous déjà payé via Calendly : Elena d'abord, cliente ensuite)
router.post('/consultation-minutee', async (req, res) => {
  try {
    const { telephone, forfaitCode } = req.body;

    if (!twilio) {
      return res.status(503).json({ error: 'Twilio non configuré.' });
    }

    // 1. Valider le numéro cliente (format FR)
    const telNormalise = normalizePhone(telephone);
    if (!telephone || !estNumeroFrValide(telNormalise)) {
      return res.status(400).json({
        error: 'Numéro invalide. Format attendu : 06 XX XX XX XX ou +33 6 XX XX XX XX.',
      });
    }

    // 2. Résoudre le forfait depuis la config (rien en dur)
    const tarifs = await getTarifs();
    const forfait = tarifs.forfaits.find((f) => f.code === forfaitCode);
    if (!forfait) {
      return res.status(400).json({
        error: `Forfait inconnu. Choix possibles : ${tarifs.forfaits.map((f) => f.code).join(', ')}.`,
      });
    }

    // 3. Téléphone d'Elena (profil consultant de la praticienne)
    const { data: consultant } = await supabase
      .from('consultants')
      .select('id, user_id, users(phone)')
      .limit(1)
      .single();

    const elenaPhone = normalizePhone(consultant?.users?.phone);
    if (!elenaPhone) {
      return res.status(400).json({ error: 'Numéro de la praticienne introuvable.' });
    }

    // 4. VERROU ATOMIQUE : hors_ligne OU disponible → en_consultation.
    //    Un forfait Calendly peut démarrer même si le mode immédiat est
    //    fermé — mais jamais pendant un autre appel.
    const maxSeconds = forfait.minutes * 60;
    const { statut: statutActuel } = await getStatutEnLigne();
    if (statutActuel === 'en_consultation') {
      return res.status(409).json({ error: 'Une consultation est déjà en cours.' });
    }

    const p = await getPraticienne();
    const { data: verrou } = await supabase
      .from('praticiennes')
      .update({
        statut: 'en_consultation',
        statut_precedent: statutActuel,
        statut_en_ligne: false, // legacy
        retour_prevu: new Date(Date.now() + maxSeconds * 1000).toISOString(),
      })
      .eq('id', p.id)
      .neq('statut', 'en_consultation')
      .select('id');
    clearCache();

    if (!verrou || verrou.length === 0) {
      return res.status(409).json({ error: 'Une consultation est déjà en cours.' });
    }

    // 5. Créer la session forfait_manuel (payée via Calendly : pas de wallet)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        client_id: null,
        consultant_id: consultant.id,
        type: 'forfait_manuel',
        forfait_code: forfait.code,
        forfait_minutes: forfait.minutes,
        montant_paye: forfait.prix,
        telephone_cliente: telNormalise,
        rate_per_minute: Math.round((forfait.prix / forfait.minutes) * 100) / 100,
        status: 'pending',
      })
      .select()
      .single();

    if (sessionError) {
      await libererConsultation();
      throw sessionError;
    }

    // 6. Appeler ELENA D'ABORD. La cliente sera composée automatiquement
    //    quand Elena aura rejoint la conférence (cf. conference-status).
    const backendUrl = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');
    let elenaCall;
    try {
      elenaCall = await twilio.calls.create({
        to: elenaPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${backendUrl}/api/calls/twiml/join?sessionId=${session.id}&role=consultant`,
        method: 'GET', // /twiml/join est une route GET (défaut Twilio = POST)
        timeLimit: maxSeconds + 300, // marge : attente de la cliente incluse
        statusCallback: `${backendUrl}/api/calls/status`,
        statusCallbackEvent: ['failed', 'busy', 'no-answer', 'canceled', 'completed'],
        statusCallbackMethod: 'POST',
      });
    } catch (twilioErr) {
      // Libérer le verrou EN PREMIER (le plus critique : sinon le statut
      // reste bloqué "en consultation") — chaque étape isolée pour qu'une
      // erreur réseau sur l'une ne court-circuite pas l'autre.
      await libererConsultation(); // ne lève jamais
      try {
        await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', session.id);
      } catch (cancelErr) {
        console.error(`Annulation de session échouée après échec Twilio : ${cancelErr.message}`);
      }
      throw twilioErr;
    }

    await supabase
      .from('sessions')
      .update({ twilio_call_sid: elenaCall.sid, status: 'active' })
      .eq('id', session.id);

    // RENDEZ-VOUS CALENDLY — on enregistre la TENTATIVE, pas la réussite.
    // Marquer « honoré » ici ferait disparaître de la liste du jour un
    // rendez-vous dont l'appel peut encore échouer (personne ne décroche,
    // cliente injoignable) : Elena l'oublierait. Le passage en « honoré »
    // a lieu à la clôture, et seulement si les deux se sont parlé.
    if (req.body.rendezVousId) {
      const { data: rdv } = await supabase
        .from('rendez_vous')
        .select('tentatives')
        .eq('id', req.body.rendezVousId)
        .maybeSingle();

      await supabase
        .from('rendez_vous')
        .update({
          session_id: session.id,
          tentatives: (rdv?.tentatives ?? 0) + 1,
          derniere_tentative: new Date().toISOString(),
          maj_le: new Date().toISOString(),
        })
        .eq('id', req.body.rendezVousId);
    }

    // Purge RGPD au passage (paresseuse, sans impact sur la réponse)
    purgerTelephones();

    res.status(201).json({
      sessionId: session.id,
      forfait: forfait.nom,
      minutes: forfait.minutes,
      message: `Appel lancé : votre téléphone va sonner, puis la cliente sera appelée. Coupure automatique à ${forfait.minutes} min, signal à ${forfait.minutes - 2} min.`,
    });
  } catch (err) {
    console.error('Erreur consultation minutée:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du lancement' });
  }
});

// GET /api/admin/jour - Vue du jour : appels, durées, revenus, soldes
router.get('/jour', async (req, res) => {
  try {
    const p = await getPraticienne();
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, type, status, duration_seconds, total_cost, created_at, ended_at, client_id')
      .eq('praticienne_id', p.id)
      .gte('created_at', debutJour.toISOString());

    if (sessionsError) throw sessionsError;

    // Distinction nette : une consultation ABOUTIE (vous vous êtes parlé)
    // n'est pas une TENTATIVE SANS RÉPONSE. Les mélanger fausse la lecture.
    const terminees = sessions.filter((s) => s.status === 'completed');
    const sansReponse = sessions.filter((s) => s.status === 'cancelled');
    const dureeTotaleSecondes = terminees.reduce(
      (acc, s) => acc + (s.duration_seconds || 0), 0
    );
    const revenus = terminees.reduce(
      (acc, s) => acc + parseFloat(s.total_cost || 0), 0
    );

    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('praticienne_id', p.id);

    if (walletsError) throw walletsError;

    const soldesClients = wallets.reduce(
      (acc, w) => acc + parseFloat(w.balance || 0), 0
    );

    // Purge RGPD paresseuse (numéros clientes > rétention)
    purgerTelephones();

    res.json({
      appelsDuJour: sessions.length,
      appelsTermines: terminees.length,
      consultationsAbouties: terminees.length,
      tentativesSansReponse: sansReponse.length,
      appelsActifs: sessions.filter((s) => s.status === 'active').length,
      forfaitsManuels: sessions.filter((s) => s.type === 'forfait_manuel').length,
      dureeTotaleMinutes: Math.round(dureeTotaleSecondes / 60),
      revenusJour: Math.round(revenus * 100) / 100,
      soldesClientsTotal: Math.round(soldesClients * 100) / 100,
      nombreWallets: wallets.length,
      // « Dernier appel : Claire, 08:12, 2 min » — le geste le plus
      // fréquent après une consultation est d'ouvrir la fiche de celle
      // qu'on vient de quitter. Autant l'avoir sous la main plutôt que
      // de passer par le Journal.
      dernierAppel: await dernierAppelDuJour(terminees),
    });
  } catch (err) {
    console.error('Erreur vue du jour:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// PLATEFORME CABINET — journal des appels + fiches clientes.
// Routes sous authMiddleware + adminOnly (cf. router.use en tête) :
// réservées à la praticienne. Ni email ni numéro de téléphone exposés
// (contrainte de confidentialité existante) — l'identité se limite au
// prénom + initiale du nom.
// ------------------------------------------------------------------

// Libellé lisible d'une session pour le journal
function libelleFormule(s) {
  if (s.type === 'forfait' || s.type === 'forfait_manuel') {
    if (s.forfait_code === 'decouverte') return 'Consultation Découverte';
    if (s.forfait_code === 'complete') return 'Consultation Complète';
    return s.forfait_minutes ? `Forfait ${s.forfait_minutes} min` : 'Forfait';
  }
  return 'Consultation Immédiate';
}

// Issue lisible d'une session pour le journal
function issueSession(s) {
  if (s.status === 'completed') {
    if (s.type === 'minute' && (!s.total_cost || parseFloat(s.total_cost) === 0)) {
      return 'non_facturee'; // franchise < 60 s
    }
    return 'terminee';
  }
  if (s.status === 'cancelled') return 'manquee'; // jamais connectés / répondeur / annulé
  if (s.status === 'active' || s.status === 'pending') {
    // Une session encore "active" des heures après est un reliquat
    // (crash, test interrompu) : ne pas afficher "En cours" à tort.
    const age = Date.now() - new Date(s.created_at).getTime();
    return age > 2 * 3600 * 1000 ? 'interrompue' : 'en_cours';
  }
  return s.status; // failed / refunded
}

// GET /api/admin/appels - Journal des appels (50 derniers)
router.get('/appels', async (req, res) => {
  try {
    const p = await getPraticienne();

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(
        'id, type, status, forfait_code, forfait_minutes, client_id, created_at, started_at, ended_at, duration_seconds, total_cost, montant_paye'
      )
      .eq('praticienne_id', p.id)
      .order('created_at', { ascending: false })
      .limit(200); // de quoi naviguer sur plusieurs mois côté cabinet

    if (error) throw error;

    // Prénoms des clientes concernées (une seule requête)
    const clientIds = [...new Set(sessions.map((s) => s.client_id).filter(Boolean))];
    let nomsParId = {};
    if (clientIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name, phone')
        .in('id', clientIds);
      for (const u of users || []) {
        nomsParId[u.id] = {
          prenom: u.first_name || 'Cliente',
          initiale: u.last_name ? `${u.last_name.charAt(0).toUpperCase()}.` : '',
          telephone: u.phone || null, // rappeler en un clic un appel manqué
        };
      }
    }

    res.json(
      sessions.map((s) => ({
        id: s.id,
        date: s.started_at || s.created_at,
        clienteId: s.client_id,
        cliente: s.client_id
          ? nomsParId[s.client_id] || { prenom: 'Cliente', initiale: '', telephone: null }
          : { prenom: 'Rendez-vous', initiale: '', telephone: null }, // forfait manuel
        formule: libelleFormule(s),
        issue: issueSession(s),
        dureeSecondes: s.duration_seconds || 0,
        montant:
          s.type === 'forfait_manuel'
            ? parseFloat(s.montant_paye || 0)
            : parseFloat(s.total_cost || 0),
      }))
    );
  } catch (err) {
    console.error('Erreur journal des appels:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/clientes - Liste des clientes (avec agrégats)
router.get('/clientes', async (req, res) => {
  try {
    const p = await getPraticienne();

    // Fiches destinées à la praticienne (route adminOnly) : email et
    // téléphone inclus — elle en a besoin pour recontacter ses clientes,
    // comme tout carnet de cabinet. Jamais exposés côté public.
    const { data: clientes, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const ids = clientes.map((c) => c.id);
    let walletsParId = {};
    let sessionsParId = {};

    if (ids.length > 0) {
      const [{ data: wallets }, { data: sessions }] = await Promise.all([
        supabase
          .from('wallets')
          .select('user_id, balance')
          .eq('praticienne_id', p.id)
          .in('user_id', ids),
        supabase
          .from('sessions')
          .select('client_id, status, started_at, duration_seconds, total_cost, type')
          .eq('praticienne_id', p.id)
          .in('client_id', ids),
      ]);

      for (const w of wallets || []) walletsParId[w.user_id] = parseFloat(w.balance || 0);
      for (const s of sessions || []) {
        if (s.status !== 'completed') continue;
        const agg = (sessionsParId[s.client_id] ||= {
          nb: 0,
          derniere: null,
          total: 0,
          minute: 0,
          calendly: 0,
        });
        agg.nb += 1;
        const montant = parseFloat(s.total_cost || 0);
        agg.total += montant;
        // Deux argents distincts : la minute (portefeuille) et le forfait
        // (encaissé par Calendly). Elena veut les voir séparément.
        if (s.type === 'forfait_manuel' || s.type === 'forfait') agg.calendly += montant;
        else agg.minute += montant;
        if (s.started_at && (!agg.derniere || s.started_at > agg.derniere)) {
          agg.derniere = s.started_at;
        }
      }

      // L'ARGENT CALENDLY DORMAIT. Une réservation payée 58 € ou 129 €
      // n'apparaissait nulle part tant que la consultation n'avait pas eu
      // lieu — la cliente affichait « 0 € dépensés » alors qu'elle avait
      // déjà payé. Le rendez-vous porte le montant encaissé, à sa date de
      // paiement : c'est lui qui fait foi pour un CA à l'encaissement.
      // On ne compte que les rendez-vous NON encore honorés : une fois la
      // session créée, c'est elle qui porte le montant (sinon double).
      const { data: rdv } = await supabase
        .from('rendez_vous')
        .select('client_id, montant_paye, statut, session_id')
        .in('client_id', ids)
        .not('montant_paye', 'is', null);
      for (const r of rdv || []) {
        if (r.statut === 'annule' || r.session_id) continue;
        const agg = (sessionsParId[r.client_id] ||= {
          nb: 0,
          derniere: null,
          total: 0,
          minute: 0,
          calendly: 0,
        });
        const montant = parseFloat(r.montant_paye || 0);
        agg.total += montant;
        agg.calendly += montant;
      }
    }

    res.json(
      clientes.map((c) => ({
        id: c.id,
        prenom: c.first_name || 'Cliente',
        nom: c.last_name || '',
        email: c.email || null,
        telephone: c.phone || null,
        inscriteLe: c.created_at,
        solde: walletsParId[c.id] ?? 0,
        nbConsultations: sessionsParId[c.id]?.nb ?? 0,
        derniereConsultation: sessionsParId[c.id]?.derniere ?? null,
        totalDepense: Math.round((sessionsParId[c.id]?.total ?? 0) * 100) / 100,
        // Détail par origine — deux argents, deux lectures
        depenseMinute: Math.round((sessionsParId[c.id]?.minute ?? 0) * 100) / 100,
        depenseCalendly: Math.round((sessionsParId[c.id]?.calendly ?? 0) * 100) / 100,
      }))
    );
  } catch (err) {
    console.error('Erreur liste clientes:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/clientes/:id - Fiche cliente (profil de lecture + historique)
router.get('/clientes/:id', async (req, res) => {
  try {
    const p = await getPraticienne();

    const { data: cliente, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, date_naissance, ascendant, a_aborder, a_aborder_maj_le, created_at, role')
      .eq('id', req.params.id)
      .eq('role', 'client')
      .maybeSingle();

    if (error) throw error;
    if (!cliente) return res.status(404).json({ error: 'Cliente non trouvée' });

    const [{ data: wallet }, { data: proches }, { data: sessions }] = await Promise.all([
      supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', cliente.id)
        .eq('praticienne_id', p.id)
        .maybeSingle(),
      supabase
        .from('proches')
        .select('prenom, date_naissance, ascendant, lien')
        .eq('client_id', cliente.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('sessions')
        .select('id, type, status, forfait_code, forfait_minutes, created_at, started_at, duration_seconds, total_cost, montant_paye')
        .eq('praticienne_id', p.id)
        .eq('client_id', cliente.id)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    // Le carnet : notes ET augures, séparés à la lecture
    const [{ data: notes }, { data: datesMarquantes }] = await Promise.all([
      supabase
        .from('notes_praticienne')
        .select(CHAMPS_NOTE)
        .eq('praticienne_id', p.id)
        .eq('client_id', cliente.id)
        .order('created_at', { ascending: false })
        .limit(80),
      supabase
        .from('dates_marquantes')
        .select('id, libelle, date, recurrence_annuelle, created_at')
        .eq('praticienne_id', p.id)
        .eq('client_id', cliente.id)
        .order('date', { ascending: true }),
    ]);

    // Ses recharges (crédits Stripe) — l'autre moitié de son histoire
    let recharges = [];
    if (wallet?.id) {
      const { data: tx } = await supabase
        .from('transactions')
        .select('amount, description, created_at')
        .eq('wallet_id', wallet.id)
        .eq('type', 'credit')
        .order('created_at', { ascending: false })
        .limit(20);
      recharges = (tx || []).map((t) => ({
        date: t.created_at,
        montant: parseFloat(t.amount || 0),
        description: t.description || 'Recharge',
      }));
    }

    const totalDepense = (sessions || [])
      .filter((s) => s.status === 'completed')
      .reduce((acc, s) => acc + parseFloat(s.total_cost || 0), 0);

    // SIGNAL DE SILENCE : à quel rythme elle appelait, et depuis combien
    // de temps elle ne l'a pas fait. Information de lecture — un silence
    // s'interprète, il ne se relance pas mécaniquement.
    const dates = (sessions || [])
      .filter((s) => s.status === 'completed' && s.started_at)
      .map((s) => new Date(s.started_at).getTime())
      .sort((a, b) => b - a); // du plus récent au plus ancien

    let rythme = { intervalleMoyenJours: null, silenceJours: null, inhabituel: false };
    if (dates.length > 0) {
      const silenceJours = Math.floor((Date.now() - dates[0]) / 86400000);
      let intervalleMoyenJours = null;
      if (dates.length >= 3) {
        // Au moins deux intervalles pour parler d'un rythme
        const ecarts = [];
        for (let i = 0; i < dates.length - 1; i++) {
          ecarts.push((dates[i] - dates[i + 1]) / 86400000);
        }
        intervalleMoyenJours = Math.round(
          ecarts.reduce((a, b) => a + b, 0) / ecarts.length
        );
      }
      rythme = {
        intervalleMoyenJours,
        silenceJours,
        // Le silence dépasse nettement son habitude
        inhabituel:
          intervalleMoyenJours !== null &&
          intervalleMoyenJours > 0 &&
          silenceJours > intervalleMoyenJours * 2,
      };
    }

    res.json({
      id: cliente.id,
      prenom: cliente.first_name || 'Cliente',
      nom: cliente.last_name || '',
      email: cliente.email || null,
      telephone: cliente.phone || null,
      inscriteLe: cliente.created_at,
      dateNaissance: cliente.date_naissance || null,
      ascendant: cliente.ascendant || null,
      // Écrit par la cliente POUR être lu : l'inverse exact du carnet.
      // La date compte autant que le texte — un mot vieux de six mois ne
      // dit pas ce qu'on vient chercher aujourd'hui.
      aAborder: cliente.a_aborder || null,
      aAborderMajLe: cliente.a_aborder_maj_le || null,
      solde: wallet ? parseFloat(wallet.balance || 0) : 0,
      totalDepense: Math.round(totalDepense * 100) / 100,
      recharges,
      // Notes et augures séparés : ce qu'elle a observé vs ce qu'elle a annoncé
      notes: (notes || []).filter((n) => (n.type || 'note') === 'note').map(serialiserNote),
      augures: (notes || []).filter((n) => n.type === 'augure').map(serialiserNote),
      datesMarquantes: (datesMarquantes || []).map((d) => ({
        id: d.id,
        libelle: d.libelle,
        date: d.date,
        recurrenceAnnuelle: d.recurrence_annuelle,
        createdAt: d.created_at,
      })),
      // SIGNAL DE SILENCE — information, jamais relance automatique
      rythme,
      proches: (proches || []).map((pr) => ({
        prenom: pr.prenom,
        dateNaissance: pr.date_naissance,
        ascendant: pr.ascendant || null,
        lien: pr.lien,
      })),
      consultations: (sessions || []).map((s) => ({
        id: s.id,
        date: s.started_at || s.created_at,
        formule: libelleFormule(s),
        issue: issueSession(s),
        dureeSecondes: s.duration_seconds || 0,
        montant:
          s.type === 'forfait_manuel'
            ? parseFloat(s.montant_paye || 0)
            : parseFloat(s.total_cost || 0),
      })),
    });
  } catch (err) {
    console.error('Erreur fiche cliente:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/recharges - Les recharges encaissées (pour la cascade
// de l'onglet Revenus : les frais Stripe se calculent par transaction).
router.get('/recharges', async (req, res) => {
  try {
    const p = await getPraticienne();

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, amount, description, created_at, wallet_id')
      .eq('praticienne_id', p.id)
      .eq('type', 'credit')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw error;

    res.json(
      (transactions || []).map((t) => ({
        id: t.id,
        date: t.created_at,
        montant: parseFloat(t.amount || 0),
        description: t.description,
      }))
    );
  } catch (err) {
    console.error('Erreur recharges:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// CARNET DE NOTES — privé, jamais exposé aux clientes.
// ------------------------------------------------------------------

const CHAMPS_NOTE =
  'id, contenu, type, a_suivre, echeance, echeance_texte, statut, close_le, created_at';

function serialiserNote(n) {
  return {
    id: n.id,
    contenu: n.contenu,
    type: n.type || 'note',
    aSuivre: n.a_suivre,
    echeance: n.echeance,
    echeanceTexte: n.echeance_texte || null,
    statut: n.statut || null,
    closeLe: n.close_le,
    createdAt: n.created_at,
  };
}

const STATUTS_AUGURE = ['attente', 'confirme', 'pas_encore'];

// POST /api/admin/clientes/:id/notes - Ajouter une note
router.post('/clientes/:id/notes', async (req, res) => {
  try {
    const contenu = typeof req.body.contenu === 'string' ? req.body.contenu.trim() : '';
    if (!contenu) {
      return res.status(400).json({ error: 'La note est vide.' });
    }
    if (contenu.length > 5000) {
      return res.status(400).json({ error: 'Note trop longue (5000 caractères maximum).' });
    }

    const aSuivre = req.body.aSuivre === true;
    let echeance = null;
    if (aSuivre && req.body.echeance) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.echeance)) {
        return res.status(400).json({ error: 'Échéance invalide (format AAAA-MM-JJ).' });
      }
      echeance = req.body.echeance;
    }

    const p = await getPraticienne();

    // La cliente doit exister (et être une cliente)
    const { data: cliente } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.params.id)
      .eq('role', 'client')
      .maybeSingle();

    if (!cliente) return res.status(404).json({ error: 'Cliente non trouvée' });

    const { data: note, error } = await supabase
      .from('notes_praticienne')
      .insert({
        praticienne_id: p.id,
        client_id: req.params.id,
        session_id: req.body.sessionId || null,
        contenu,
        a_suivre: aSuivre,
        echeance,
      })
      .select(CHAMPS_NOTE)
      .single();

    if (error) throw error;

    res.status(201).json(serialiserNote(note));
  } catch (err) {
    console.error('Erreur ajout note:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/notes/:id - Clore ou rouvrir un suivi
router.patch('/notes/:id', async (req, res) => {
  try {
    const maj = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'close')) {
      maj.close_le = req.body.close ? new Date().toISOString() : null;
    }
    if (Object.keys(maj).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
    }

    const p = await getPraticienne();
    const { data, error } = await supabase
      .from('notes_praticienne')
      .update(maj)
      .eq('id', req.params.id)
      .eq('praticienne_id', p.id)
      .select(CHAMPS_NOTE);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }

    res.json(serialiserNote(data[0]));
  } catch (err) {
    console.error('Erreur mise à jour note:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/notes/:id - Supprimer une note
router.delete('/notes/:id', async (req, res) => {
  try {
    const p = await getPraticienne();
    const { data, error } = await supabase
      .from('notes_praticienne')
      .delete()
      .eq('id', req.params.id)
      .eq('praticienne_id', p.id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }

    res.json({ message: 'Note supprimée.' });
  } catch (err) {
    console.error('Erreur suppression note:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/suivis - Les annonces datées encore ouvertes
router.get('/suivis', async (req, res) => {
  try {
    const p = await getPraticienne();

    const { data: notes, error } = await supabase
      .from('notes_praticienne')
      .select('id, client_id, contenu, echeance, created_at')
      .eq('praticienne_id', p.id)
      .eq('a_suivre', true)
      .is('close_le', null)
      .order('echeance', { ascending: true, nullsFirst: false })
      .limit(100);

    if (error) throw error;

    const ids = [...new Set((notes || []).map((n) => n.client_id))];
    let nomsParId = {};
    if (ids.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', ids);
      for (const u of users || []) {
        nomsParId[u.id] = `${u.first_name || 'Cliente'} ${u.last_name || ''}`.trim();
      }
    }

    res.json(
      (notes || []).map((n) => ({
        id: n.id,
        clienteId: n.client_id,
        cliente: nomsParId[n.client_id] || 'Cliente',
        contenu: n.contenu,
        echeance: n.echeance,
        createdAt: n.created_at,
      }))
    );
  } catch (err) {
    console.error('Erreur suivis:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// AUGURES — ce que la praticienne a ANNONCÉ, distinct de ses notes.
// ------------------------------------------------------------------

// POST /api/admin/clientes/:id/augures - Poser un augure
router.post('/clientes/:id/augures', async (req, res) => {
  try {
    const contenu = typeof req.body.contenu === 'string' ? req.body.contenu.trim() : '';
    if (!contenu) return res.status(400).json({ error: "L'augure est vide." });
    if (contenu.length > 5000) {
      return res.status(400).json({ error: 'Texte trop long (5000 caractères maximum).' });
    }

    // Échéance souple : un texte ("vers octobre") et/ou une date
    const echeanceTexte =
      typeof req.body.echeanceTexte === 'string'
        ? req.body.echeanceTexte.trim().slice(0, 120) || null
        : null;
    let echeance = null;
    if (req.body.echeance) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.echeance)) {
        return res.status(400).json({ error: 'Échéance invalide (format AAAA-MM-JJ).' });
      }
      echeance = req.body.echeance;
    }

    const p = await getPraticienne();
    const { data: cliente } = await supabase
      .from('users').select('id').eq('id', req.params.id).eq('role', 'client').maybeSingle();
    if (!cliente) return res.status(404).json({ error: 'Cliente non trouvée' });

    const { data: augure, error } = await supabase
      .from('notes_praticienne')
      .insert({
        praticienne_id: p.id,
        client_id: req.params.id,
        contenu,
        type: 'augure',
        statut: 'attente',
        a_suivre: true,
        echeance,
        echeance_texte: echeanceTexte,
      })
      .select(CHAMPS_NOTE)
      .single();

    if (error) throw error;
    res.status(201).json(serialiserNote(augure));
  } catch (err) {
    console.error('Erreur ajout augure:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/augures/:id - Changer le statut d'un augure
router.patch('/augures/:id', async (req, res) => {
  try {
    const statut = req.body.statut;
    if (!STATUTS_AUGURE.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }

    const p = await getPraticienne();
    const { data, error } = await supabase
      .from('notes_praticienne')
      .update({
        statut,
        // « en attente » rouvre l'augure ; les deux autres le clôturent
        close_le: statut === 'attente' ? null : new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('praticienne_id', p.id)
      .eq('type', 'augure')
      .select(CHAMPS_NOTE);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Augure non trouvé' });
    }
    res.json(serialiserNote(data[0]));
  } catch (err) {
    console.error('Erreur mise à jour augure:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/a-reprendre - Les augures dont l'heure vient
router.get('/a-reprendre', async (req, res) => {
  try {
    const p = await getPraticienne();
    // Fenêtre : tout ce qui échoit dans les 30 jours, plus le passé
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);

    const { data: augures, error } = await supabase
      .from('notes_praticienne')
      .select('id, client_id, contenu, echeance, echeance_texte, created_at')
      .eq('praticienne_id', p.id)
      .eq('type', 'augure')
      .eq('statut', 'attente')
      .order('echeance', { ascending: true, nullsFirst: false })
      .limit(100);

    if (error) throw error;

    // Ne remontent que ceux dont l'échéance approche ou est passée.
    // Sans date (échéance en toutes lettres), on garde : à elle de juger.
    const limite = horizon.toISOString().slice(0, 10);
    const retenus = (augures || []).filter((a) => !a.echeance || a.echeance <= limite);

    const ids = [...new Set(retenus.map((a) => a.client_id))];
    let noms = {};
    if (ids.length > 0) {
      const { data: users } = await supabase
        .from('users').select('id, first_name, last_name').in('id', ids);
      for (const u of users || []) {
        noms[u.id] = `${u.first_name || 'Cliente'} ${u.last_name || ''}`.trim();
      }
    }

    res.json(
      retenus.map((a) => ({
        id: a.id,
        clienteId: a.client_id,
        cliente: noms[a.client_id] || 'Cliente',
        contenu: a.contenu,
        echeance: a.echeance,
        echeanceTexte: a.echeance_texte || null,
        depasse: a.echeance ? a.echeance < new Date().toISOString().slice(0, 10) : false,
        createdAt: a.created_at,
      }))
    );
  } catch (err) {
    console.error('Erreur à reprendre:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// DATES QUI PÈSENT — confiées en consultation, strictement privées.
// ------------------------------------------------------------------

// POST /api/admin/clientes/:id/dates - Enregistrer une date marquante
router.post('/clientes/:id/dates', async (req, res) => {
  try {
    const libelle = typeof req.body.libelle === 'string' ? req.body.libelle.trim() : '';
    if (!libelle) return res.status(400).json({ error: 'Le libellé est requis.' });
    if (libelle.length > 200) {
      return res.status(400).json({ error: 'Libellé trop long (200 caractères maximum).' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.date || '')) {
      return res.status(400).json({ error: 'Date invalide (format AAAA-MM-JJ).' });
    }

    const p = await getPraticienne();
    const { data: cliente } = await supabase
      .from('users').select('id').eq('id', req.params.id).eq('role', 'client').maybeSingle();
    if (!cliente) return res.status(404).json({ error: 'Cliente non trouvée' });

    const { data: d, error } = await supabase
      .from('dates_marquantes')
      .insert({
        praticienne_id: p.id,
        client_id: req.params.id,
        libelle,
        date: req.body.date,
        recurrence_annuelle: req.body.recurrenceAnnuelle !== false,
      })
      .select('id, libelle, date, recurrence_annuelle, created_at')
      .single();

    if (error) throw error;
    res.status(201).json({
      id: d.id,
      libelle: d.libelle,
      date: d.date,
      recurrenceAnnuelle: d.recurrence_annuelle,
      createdAt: d.created_at,
    });
  } catch (err) {
    console.error('Erreur ajout date marquante:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/dates/:id
router.delete('/dates/:id', async (req, res) => {
  try {
    const p = await getPraticienne();
    const { data, error } = await supabase
      .from('dates_marquantes')
      .delete()
      .eq('id', req.params.id)
      .eq('praticienne_id', p.id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Date non trouvée' });
    }
    res.json({ message: 'Date supprimée.' });
  } catch (err) {
    console.error('Erreur suppression date:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Jours restants avant la prochaine occurrence d'un jour/mois donné
function joursAvant(dateISO, recurrent = true) {
  if (!dateISO) return null;
  const [, mois, jour] = dateISO.split('-').map(Number);
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);

  if (!recurrent) {
    const d = new Date(dateISO + 'T00:00:00');
    return Math.round((d - auj) / 86400000);
  }
  // Prochaine occurrence annuelle
  let prochaine = new Date(auj.getFullYear(), mois - 1, jour);
  if (prochaine < auj) prochaine = new Date(auj.getFullYear() + 1, mois - 1, jour);
  return Math.round((prochaine - auj) / 86400000);
}

// GET /api/admin/dates-a-venir?jours=45 - Anniversaires et dates qui pèsent
router.get('/dates-a-venir', async (req, res) => {
  try {
    const p = await getPraticienne();
    const fenetre = Math.min(180, Math.max(1, parseInt(req.query.jours, 10) || 45));

    const [{ data: clientes }, { data: proches }, { data: marquantes }] =
      await Promise.all([
        supabase
          .from('users')
          .select('id, first_name, last_name, date_naissance')
          .eq('role', 'client')
          .not('date_naissance', 'is', null),
        supabase.from('proches').select('client_id, prenom, date_naissance, lien')
          .not('date_naissance', 'is', null),
        supabase
          .from('dates_marquantes')
          .select('id, client_id, libelle, date, recurrence_annuelle')
          .eq('praticienne_id', p.id),
      ]);

    const nomsClientes = {};
    for (const c of clientes || []) {
      nomsClientes[c.id] = `${c.first_name || 'Cliente'} ${c.last_name || ''}`.trim();
    }
    // Les proches appartiennent à des clientes qui n'ont pas forcément
    // renseigné leur propre date de naissance : compléter les noms.
    const idsManquants = [...new Set((proches || []).map((x) => x.client_id))]
      .filter((id) => !nomsClientes[id]);
    if (idsManquants.length > 0) {
      const { data: autres } = await supabase
        .from('users').select('id, first_name, last_name').in('id', idsManquants);
      for (const u of autres || []) {
        nomsClientes[u.id] = `${u.first_name || 'Cliente'} ${u.last_name || ''}`.trim();
      }
    }
    const idsMarquantes = [...new Set((marquantes || []).map((x) => x.client_id))]
      .filter((id) => !nomsClientes[id]);
    if (idsMarquantes.length > 0) {
      const { data: autres } = await supabase
        .from('users').select('id, first_name, last_name').in('id', idsMarquantes);
      for (const u of autres || []) {
        nomsClientes[u.id] = `${u.first_name || 'Cliente'} ${u.last_name || ''}`.trim();
      }
    }

    const evenements = [];

    for (const c of clientes || []) {
      const j = joursAvant(c.date_naissance, true);
      if (j !== null && j <= fenetre) {
        evenements.push({
          type: 'anniversaire_cliente',
          clienteId: c.id,
          cliente: nomsClientes[c.id],
          libelle: `Anniversaire de ${c.first_name || 'la cliente'}`,
          date: c.date_naissance,
          jours: j,
        });
      }
    }

    for (const pr of proches || []) {
      const j = joursAvant(pr.date_naissance, true);
      if (j !== null && j <= fenetre) {
        evenements.push({
          type: 'anniversaire_proche',
          clienteId: pr.client_id,
          cliente: nomsClientes[pr.client_id] || 'Cliente',
          libelle: `Anniversaire de ${pr.prenom} (${pr.lien})`,
          date: pr.date_naissance,
          jours: j,
        });
      }
    }

    for (const d of marquantes || []) {
      const j = joursAvant(d.date, d.recurrence_annuelle);
      if (j !== null && j >= 0 && j <= fenetre) {
        evenements.push({
          type: 'date_marquante',
          clienteId: d.client_id,
          cliente: nomsClientes[d.client_id] || 'Cliente',
          libelle: d.libelle,
          date: d.date,
          jours: j,
          recurrenceAnnuelle: d.recurrence_annuelle,
        });
      }
    }

    evenements.sort((a, b) => a.jours - b.jours);
    res.json(evenements);
  } catch (err) {
    console.error('Erreur dates à venir:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/frequentation?jours=30 - Quand les clientes viennent.
// Lit UNIQUEMENT des compteurs agrégés : aucune identité n'y figure,
// par construction (cf. migration 006).
router.get('/frequentation', async (req, res) => {
  try {
    const p = await getPraticienne();
    const jours = Math.min(180, Math.max(7, parseInt(req.query.jours, 10) || 30));
    const depuis = new Date();
    depuis.setDate(depuis.getDate() - jours);

    const { data: visites, error } = await supabase
      .from('visites_agregees')
      .select('jour, heure, jour_semaine, avec_credit, page, compteur')
      .eq('praticienne_id', p.id)
      .gte('jour', depuis.toISOString().slice(0, 10));

    if (error) throw error;

    // Grille jour de semaine × heure, deux compteurs par case
    const grille = {};
    let totalAvec = 0;
    let totalSans = 0;

    for (const v of visites || []) {
      const cle = `${v.jour_semaine}-${v.heure}`;
      const c = (grille[cle] ||= { jourSemaine: v.jour_semaine, heure: v.heure, avecCredit: 0, sansCredit: 0 });
      if (v.avec_credit) {
        c.avecCredit += v.compteur;
        totalAvec += v.compteur;
      } else {
        c.sansCredit += v.compteur;
        totalSans += v.compteur;
      }
    }

    const cases = Object.values(grille);
    // Le meilleur créneau : là où le plus de clientes AVEC crédit passent
    const meilleur = cases.reduce(
      (best, c) => (!best || c.avecCredit > best.avecCredit ? c : best),
      null
    );

    res.json({
      jours,
      cases,
      totalAvecCredit: totalAvec,
      totalSansCredit: totalSans,
      meilleurCreneau: meilleur && meilleur.avecCredit > 0 ? meilleur : null,
    });
  } catch (err) {
    console.error('Erreur fréquentation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// PROFIL PRATICIENNE — ce qu'elle doit pouvoir changer seule, sans
// passer par la base de données.
// ------------------------------------------------------------------

// GET /api/admin/profil - Tarifs, textes et coordonnées
router.get('/profil', async (req, res) => {
  try {
    const p = await getPraticienne();
    const t = p.config_tarifs || {};
    const r = t.recharge || {};
    const b = p.config_branding || {};

    // Son numéro personnel (celui que Twilio compose pour la joindre)
    let telephone = null;
    let email = null;
    const { data: consultant } = await supabase
      .from('consultants')
      .select('user_id')
      .eq('praticienne_id', p.id)
      .limit(1)
      .maybeSingle();
    if (consultant?.user_id) {
      const { data: u } = await supabase
        .from('users')
        .select('phone, email')
        .eq('id', consultant.user_id)
        .maybeSingle();
      telephone = u?.phone || null;
      email = u?.email || null;
    }

    res.json({
      nomPublic: p.nom_public,
      telephone,
      email,
      numeroLigne: process.env.TWILIO_PHONE_NUMBER || null,
      tarifs: {
        prixMinute: t.prix_minute ?? 2.9,
        // Les prix affichés sont-ils TTC (ce que la cliente paie) ou HT ?
        // Par défaut TTC : c'est le comportement historique du calcul de
        // revenus, et le prix annoncé sur le site est celui qui est débité.
        prixTTC: t.prix_ttc !== false,
        creditMinimumMinutes: t.credit_minimum_minutes ?? 5,
        bipAvantFinSecondes: t.bip_avant_fin_secondes ?? 120,
        forfaits: t.forfaits ?? [],
        recharge: {
          suggestionsMinutes: r.suggestions_minutes ?? [10, 20, 30],
          defautMinutes: r.defaut_minutes ?? 20,
          pasMinutes: r.pas_minutes ?? 5,
          minMinutes: r.min_minutes ?? 5,
          maxMinutes: r.max_minutes ?? 90,
        },
      },
      textes: {
        tagline: b.tagline || '',
        signature: b.signature || '',
        messageAbsence: b.message_absence || '',
        heuresIndicatives: b.heures_indicatives || '',
        absenceDebut: b.absence_debut || '',
        absenceFin: b.absence_fin || '',
      },
      messagesVocaux: p.messages_vocaux || {},
      autoOffHeures: p.auto_off_heures ?? 4,
      // Réglages de pilotage : en base désormais, plus dans le navigateur.
      reglages: bornerReglages(t.reglages),
    });
  } catch (err) {
    console.error('Erreur profil praticienne:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// CHANGEMENT DE NUMÉRO — avec appel de vérification préalable.
//
// Le numéro de la praticienne est celui que Twilio compose pour la
// joindre. Une faute de frappe la rendrait injoignable sans qu'elle
// comprenne pourquoi. Le nouveau numéro est donc mis EN ATTENTE, Twilio
// l'appelle et énonce un code, et il ne remplace l'ancien qu'une fois
// le code saisi. Tant que rien n'est confirmé, l'ancien reste actif.
// ------------------------------------------------------------------

// Résout la fiche utilisateur de la praticienne
async function utilisateurPraticienne(praticienneId) {
  const { data: consultant } = await supabase
    .from('consultants')
    .select('user_id')
    .eq('praticienne_id', praticienneId)
    .limit(1)
    .maybeSingle();
  return consultant?.user_id || null;
}

// POST /api/admin/telephone/demander - Lance l'appel de vérification
router.post('/telephone/demander', async (req, res) => {
  try {
    if (!twilio) {
      return res.status(503).json({ error: 'Téléphonie non configurée.' });
    }

    const telephone = normalizePhone(req.body.telephone || '');
    if (!estNumeroFrValide(telephone)) {
      return res.status(400).json({
        error: 'Numéro invalide. Indiquez un mobile français (ex. 06 12 34 56 78).',
      });
    }

    const numeroLigne = normalizePhone(process.env.TWILIO_PHONE_NUMBER || '');
    if (telephone === numeroLigne) {
      return res.status(400).json({
        error: "Ce numéro est celui de votre ligne : Twilio ne peut pas l'appeler depuis lui-même.",
      });
    }

    const p = await getPraticienne();
    const userId = await utilisateurPraticienne(p.id);
    if (!userId) return res.status(500).json({ error: 'Profil praticienne introuvable.' });

    // Une seule vérification en attente : on remplace la précédente
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expire = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('verifications_numero').delete().eq('user_id', userId);
    const { data: verif, error } = await supabase
      .from('verifications_numero')
      .insert({ user_id: userId, telephone, code, expire_le: expire })
      .select('id')
      .single();
    if (error) throw error;

    const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
    try {
      const appel = await twilio.calls.create({
        to: telephone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${backendUrl}/api/calls/twiml/verification?id=${verif.id}`,
        method: 'GET',
        timeLimit: 60,
      });
      await supabase
        .from('verifications_numero')
        .update({ call_sid: appel.sid })
        .eq('id', verif.id);
    } catch (twErr) {
      // L'appel n'est pas parti : inutile de laisser une attente fantôme
      await supabase.from('verifications_numero').delete().eq('id', verif.id);
      console.error('Appel de vérification impossible:', twErr.message);
      return res.status(502).json({
        error: "Impossible d'appeler ce numéro. Vérifiez-le et réessayez.",
      });
    }

    console.log(`Vérification de numéro lancée vers ${masquer(telephone)}`);
    res.json({
      message: 'Votre téléphone va sonner. Notez le code annoncé.',
      telephone,
      expireDans: 600,
    });
  } catch (err) {
    console.error('Erreur demande de vérification:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Masque un numéro pour les journaux
function masquer(n) {
  return typeof n === 'string' && n.length >= 8
    ? `${n.slice(0, 4)}****${n.slice(-4)}`
    : '(inconnu)';
}

// POST /api/admin/telephone/confirmer - Valide le code et enregistre
router.post('/telephone/confirmer', async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({ error: 'Code à 4 chiffres attendu.' });
    }

    const p = await getPraticienne();
    const userId = await utilisateurPraticienne(p.id);
    if (!userId) return res.status(500).json({ error: 'Profil praticienne introuvable.' });

    const { data: verif } = await supabase
      .from('verifications_numero')
      .select('id, telephone, code, tentatives, expire_le')
      .eq('user_id', userId)
      .maybeSingle();

    if (!verif) {
      return res.status(404).json({ error: 'Aucune vérification en cours.' });
    }
    if (new Date(verif.expire_le) < new Date()) {
      await supabase.from('verifications_numero').delete().eq('id', verif.id);
      return res.status(410).json({ error: 'Code expiré. Relancez la vérification.' });
    }
    if (verif.tentatives >= 5) {
      await supabase.from('verifications_numero').delete().eq('id', verif.id);
      return res.status(429).json({ error: 'Trop de tentatives. Relancez la vérification.' });
    }
    if (verif.code !== code) {
      await supabase
        .from('verifications_numero')
        .update({ tentatives: verif.tentatives + 1 })
        .eq('id', verif.id);
      return res.status(401).json({
        error: `Code incorrect (${4 - verif.tentatives} essai${4 - verif.tentatives > 1 ? 's' : ''} restant${4 - verif.tentatives > 1 ? 's' : ''}).`,
      });
    }

    // Code juste : le numéro a sonné, il est joignable — on l'enregistre
    const { error: majErr } = await supabase
      .from('users')
      .update({ phone: verif.telephone })
      .eq('id', userId);
    if (majErr) throw majErr;

    await supabase.from('verifications_numero').delete().eq('id', verif.id);
    console.log(`Numéro praticienne confirmé : ${masquer(verif.telephone)}`);

    res.json({
      message: 'Numéro vérifié et enregistré.',
      telephone: verif.telephone,
    });
  } catch (err) {
    console.error('Erreur confirmation de numéro:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/telephone/verification - Abandonner
router.delete('/telephone/verification', async (req, res) => {
  try {
    const p = await getPraticienne();
    const userId = await utilisateurPraticienne(p.id);
    if (userId) {
      await supabase.from('verifications_numero').delete().eq('user_id', userId);
    }
    res.json({ message: 'Vérification annulée.' });
  } catch (err) {
    console.error('Erreur annulation vérification:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/tarifs - Modifier tarifs, forfaits et paliers
router.patch('/tarifs', async (req, res) => {
  try {
    const p = await getPraticienne();
    const actuel = p.config_tarifs || {};
    const suivant = { ...actuel, recharge: { ...(actuel.recharge || {}) } };

    const nombre = (v, min, max) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= min && n <= max ? n : null;
    };

    // Garde-fous tarifaires : cf. utils/tarifs.js
    if ('prixMinute' in req.body) {
      const erreur = verifierPrixMinute(req.body.prixMinute);
      if (erreur) return res.status(400).json({ error: erreur });
      suivant.prix_minute = Number(req.body.prixMinute);
    }

    if ('prixTTC' in req.body) {
      if (typeof req.body.prixTTC !== 'boolean') {
        return res.status(400).json({ error: 'Le choix TTC/HT doit être vrai ou faux.' });
      }
      suivant.prix_ttc = req.body.prixTTC;
    }
    if ('creditMinimumMinutes' in req.body) {
      const v = nombre(req.body.creditMinimumMinutes, 1, 60);
      if (v === null) return res.status(400).json({ error: 'Crédit minimum invalide (1 à 60 min).' });
      suivant.credit_minimum_minutes = Math.round(v);
    }
    if ('bipAvantFinSecondes' in req.body) {
      const v = nombre(req.body.bipAvantFinSecondes, 0, 600);
      if (v === null) return res.status(400).json({ error: 'Signal de fin invalide (0 à 600 s).' });
      suivant.bip_avant_fin_secondes = Math.round(v);
    }

    if (Array.isArray(req.body.forfaits)) {
      // Tarif à la minute effectif APRÈS cette requête : un forfait doit être
      // jugé à l'aune du prix qu'il aura, pas de celui qu'il avait.
      const prixMinuteEffectif =
        suivant.prix_minute ?? actuel.prix_minute ?? 2.9;

      const forfaits = [];
      for (const f of req.body.forfaits) {
        const minutes = nombre(f.minutes, 5, 240);
        const prix = nombre(f.prix, 1, 2000);
        const nom = typeof f.nom === 'string' ? f.nom.trim().slice(0, 80) : '';
        const code = typeof f.code === 'string' ? f.code.trim().slice(0, 40) : '';
        if (!code || !nom || minutes === null || prix === null) {
          return res.status(400).json({ error: 'Forfait invalide (code, nom, durée 5-240 min, prix).' });
        }

        const incoherent = verifierForfait({ nom, minutes, prix }, prixMinuteEffectif);
        if (incoherent) return res.status(400).json({ error: incoherent });

        forfaits.push({ code, nom, minutes: Math.round(minutes), prix });
      }
      suivant.forfaits = forfaits;
    }

    const rech = req.body.recharge;
    if (rech && typeof rech === 'object') {
      if (Array.isArray(rech.suggestionsMinutes)) {
        const s = rech.suggestionsMinutes
          .map((x) => nombre(x, 1, 240))
          .filter((x) => x !== null)
          .map(Math.round);
        if (s.length === 0) return res.status(400).json({ error: 'Paliers de recharge invalides.' });
        suivant.recharge.suggestions_minutes = s;
      }
      for (const [cle, champ, min, max] of [
        ['defautMinutes', 'defaut_minutes', 1, 240],
        ['pasMinutes', 'pas_minutes', 1, 60],
        ['minMinutes', 'min_minutes', 1, 240],
        ['maxMinutes', 'max_minutes', 1, 600],
      ]) {
        if (cle in rech) {
          const v = nombre(rech[cle], min, max);
          if (v === null) return res.status(400).json({ error: `Valeur invalide pour ${cle}.` });
          suivant.recharge[champ] = Math.round(v);
        }
      }
      if (suivant.recharge.min_minutes > suivant.recharge.max_minutes) {
        return res.status(400).json({ error: 'La durée minimale dépasse la maximale.' });
      }
    }

    const { error } = await supabase
      .from('praticiennes')
      .update({ config_tarifs: suivant })
      .eq('id', p.id);
    if (error) throw error;

    clearCache(); // les tarifs sont mis en cache : le vider
    res.json({ message: 'Tarifs mis à jour.' });
  } catch (err) {
    console.error('Erreur mise à jour tarifs:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// MES RENDEZ-VOUS DU JOUR
//
// ~5 forfaits par jour : piloter sa journée depuis un seul écran plutôt
// que depuis sa boîte mail. Les rendez-vous passés restés « prévu » ne
// disparaissent JAMAIS tout seuls — ils remontent en « à rattraper ».
// ------------------------------------------------------------------

// GET /api/admin/rendez-vous?jour=YYYY-MM-DD
router.get('/rendez-vous', async (req, res) => {
  try {
    // Le jour est calculé en heure de Paris : un rendez-vous à 23 h ne
    // doit pas basculer au lendemain à cause du fuseau du serveur.
    const jour = /^\d{4}-\d{2}-\d{2}$/.test(req.query.jour || '')
      ? req.query.jour
      : new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });

    const debutJour = new Date(`${jour}T00:00:00+02:00`).toISOString();
    const finJour = new Date(`${jour}T23:59:59+02:00`).toISOString();

    const { data, error } = await supabase
      .from('rendez_vous')
      .select(
        'id, client_id, telephone, nom, email, formule, forfait_code, minutes, debut, fin, statut, montant_paye, tentatives, derniere_tentative, session_id'
      )
      .gte('debut', debutJour)
      .lte('debut', finJour)
      .order('debut', { ascending: true });
    if (error) throw error;

    // Les rendez-vous passés d'un jour ANTÉRIEUR restés « prévu » : un
    // empêchement, un oubli. Ils remontent pour être rattrapés, jamais
    // effacés en silence.
    const { data: retard } = await supabase
      .from('rendez_vous')
      .select(
        'id, client_id, telephone, nom, email, formule, forfait_code, minutes, debut, fin, statut, montant_paye, tentatives, derniere_tentative, session_id'
      )
      .eq('statut', 'prevu')
      .lt('debut', debutJour)
      .order('debut', { ascending: false })
      .limit(20);

    // « Ce qu'elle veut aborder » : porté par le prochain rendez-vous,
    // c'est la rencontre des deux fonctionnalités — Elena sait avant de
    // décrocher ce que la cliente vient chercher.
    const idsClientes = [
      ...new Set(
        [...(data || []), ...(retard || [])]
          .filter((r) => r.statut === 'prevu' && r.client_id)
          .map((r) => r.client_id)
      ),
    ];
    // Ce que la fiche apporte au rendez-vous : le motif ET la date de
    // naissance — l'un pour savoir ce qu'elle vient chercher, l'autre
    // pour son ciel. Pour tous les rendez-vous, « à rattraper » compris :
    // Elena les prépare de la même façon.
    const ficheParId = {};
    if (idsClientes.length > 0) {
      const { data: fiches } = await supabase
        .from('users')
        .select('id, a_aborder, a_aborder_maj_le, date_naissance')
        .in('id', idsClientes);
      for (const f of fiches || []) {
        ficheParId[f.id] = {
          aAborder: f.a_aborder || null,
          aAborderMajLe: f.a_aborder_maj_le || null,
          dateNaissance: f.date_naissance || null,
        };
      }
    }

    const maintenant = Date.now();
    const enrichir = (r) => ({
      ...r,
      prenom: capitaliserPrenom(r.nom),
      // « À rattraper » se DÉDUIT — pas de statut stocké, donc rien qui
      // sorte de la liste sans qu'Elena l'ait décidé.
      aRattraper: r.statut === 'prevu' && new Date(r.debut).getTime() < maintenant,
      aAborder: (r.client_id && ficheParId[r.client_id]?.aAborder) || null,
      dateNaissance: (r.client_id && ficheParId[r.client_id]?.dateNaissance) || null,
    });

    res.json({
      jour,
      duJour: (data || []).map(enrichir),
      enRetard: (retard || []).map(enrichir),
    });
  } catch (err) {
    console.error('Erreur rendez-vous du jour:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * La dernière consultation aboutie du jour, avec le prénom de la cliente.
 * @returns {Promise<object|null>} null s'il n'y en a aucune
 */
async function dernierAppelDuJour(terminees) {
  if (!terminees || terminees.length === 0) return null;

  const dernier = [...terminees].sort(
    (a, b) =>
      new Date(b.ended_at || b.created_at) - new Date(a.ended_at || a.created_at)
  )[0];

  let prenom = 'Cliente';
  if (dernier.client_id) {
    const { data } = await supabase
      .from('users')
      .select('first_name')
      .eq('id', dernier.client_id)
      .maybeSingle();
    if (data?.first_name) prenom = capitaliserPrenom(data.first_name);
  } else if (dernier.type === 'forfait_manuel') {
    prenom = 'Rendez-vous';
  }

  return {
    clienteId: dernier.client_id,
    prenom,
    fini: dernier.ended_at || dernier.created_at,
    minutes: Math.round((dernier.duration_seconds || 0) / 60),
  };
}

function capitaliserPrenom(nom) {
  const p = String(nom || '').trim().split(/\s+/)[0] || '';
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : 'Cliente';
}

// ------------------------------------------------------------------
// PERMANENCES
//
// « Le calendrier annonce, le bouton fait foi » (Elena). Ces créneaux
// n'ouvrent JAMAIS les appels — seule la bascule « en ligne » le fait.
// Ils alimentent les écriteaux du site et de l'espace cliente.
// ------------------------------------------------------------------

// GET /api/admin/permanences?semaine=YYYY-MM-DD (un lundi ; défaut : semaine courante)
router.get('/permanences', async (req, res) => {
  try {
    const lundi = lundiDeLaSemaine(req.query.semaine);
    const finSemaine = new Date(lundi.getTime() + 7 * 86_400_000);

    const { data, error } = await supabase
      .from('permanences')
      .select('id, debut, fin')
      .gte('debut', lundi.toISOString())
      .lt('debut', finSemaine.toISOString())
      .order('debut', { ascending: true });
    if (error) throw error;

    res.json({ lundi: lundi.toISOString(), creneaux: data || [] });
  } catch (err) {
    console.error('Erreur permanences:', err);
    res.status(500).json({ error: messagePermanence(err) });
  }
});

/**
 * « Erreur serveur » n'apprend rien à qui lit l'écran. Le seul échec
 * probable ici est une table absente — la migration 012 n'ayant pas été
 * exécutée. Autant le dire, plutôt que de laisser chercher.
 */
function messagePermanence(err) {
  const texte = `${err?.message || ''} ${err?.code || ''}`.toLowerCase();
  if (texte.includes('permanences') || texte.includes('42p01') || texte.includes('does not exist')) {
    return "La table des permanences n'existe pas encore : exécutez la migration 012 dans Supabase.";
  }
  return 'Erreur serveur';
}

// POST /api/admin/permanences { debut, fin } (ISO)
router.post('/permanences', async (req, res) => {
  try {
    const debut = new Date(req.body.debut);
    const fin = new Date(req.body.fin);
    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) {
      return res.status(400).json({ error: 'Dates invalides.' });
    }
    if (fin <= debut) {
      return res.status(400).json({ error: "L'heure de fin précède le début." });
    }
    // Un créneau qui enjambe minuit est presque toujours une erreur de
    // saisie (fin « 01:00 » pensée pour le lendemain) : refus explicite.
    if (fin.getTime() - debut.getTime() > 18 * 3600 * 1000) {
      return res.status(400).json({ error: 'Créneau de plus de 18 h — vérifiez les heures.' });
    }

    const { data, error } = await supabase
      .from('permanences')
      .insert({ debut: debut.toISOString(), fin: fin.toISOString() })
      .select('id, debut, fin')
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Erreur création permanence:', err);
    res.status(500).json({ error: messagePermanence(err) });
  }
});

// DELETE /api/admin/permanences/:id
router.delete('/permanences/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('permanences')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression permanence:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/permanences/dupliquer { semaine } — recopie les
// créneaux de la semaine PRÉCÉDENTE sur celle demandée.
router.post('/permanences/dupliquer', async (req, res) => {
  try {
    const lundi = lundiDeLaSemaine(req.body.semaine);
    const lundiPrecedent = new Date(lundi.getTime() - 7 * 86_400_000);

    const { data: modeles, error } = await supabase
      .from('permanences')
      .select('debut, fin')
      .gte('debut', lundiPrecedent.toISOString())
      .lt('debut', lundi.toISOString());
    if (error) throw error;

    if (!modeles || modeles.length === 0) {
      return res.status(404).json({ error: 'Aucun créneau la semaine précédente.' });
    }

    // Idempotent : un double-clic ne double pas la semaine.
    const { data: existants } = await supabase
      .from('permanences')
      .select('debut')
      .gte('debut', lundi.toISOString())
      .lt('debut', new Date(lundi.getTime() + 7 * 86_400_000).toISOString());
    const dejaPoses = new Set((existants || []).map((e) => new Date(e.debut).getTime()));

    const nouveaux = modeles
      .map((m) => ({
        debut: new Date(new Date(m.debut).getTime() + 7 * 86_400_000).toISOString(),
        fin: new Date(new Date(m.fin).getTime() + 7 * 86_400_000).toISOString(),
      }))
      .filter((n) => !dejaPoses.has(new Date(n.debut).getTime()));

    if (nouveaux.length > 0) {
      const { error: errInsert } = await supabase.from('permanences').insert(nouveaux);
      if (errInsert) throw errInsert;
    }

    res.json({ copies: nouveaux.length, ignores: modeles.length - nouveaux.length });
  } catch (err) {
    console.error('Erreur duplication permanences:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** Lundi 00:00 (heure de Paris) de la semaine contenant la date donnée. */
function lundiDeLaSemaine(brut) {
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(brut || '')
    ? new Date(`${brut}T00:00:00+02:00`)
    : new Date();
  // Jour de semaine en heure de Paris (0 = dimanche)
  const jourParis = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short' })
      .format(ref) === 'Sun'
      ? 0
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
          new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short' }).format(ref)
        ) + 1
  );
  const recul = jourParis === 0 ? 6 : jourParis - 1;
  const jourISO = new Date(ref.getTime() - recul * 86_400_000)
    .toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  return new Date(`${jourISO}T00:00:00+02:00`);
}

// ------------------------------------------------------------------
// NUMÉROS BLOQUÉS
//
// Un numéro bloqué ne peut plus lancer de consultation depuis le site, et
// son appel entrant est raccroché sans qu'Elena en soit informée. Le motif
// est pour SA mémoire — il n'est jamais montré à personne d'autre.
// ------------------------------------------------------------------

// GET /api/admin/numeros-bloques
router.get('/numeros-bloques', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('numeros_bloques')
      .select('id, telephone, motif, bloque_le')
      .order('bloque_le', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Erreur liste numéros bloqués:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/numeros-bloques
router.post('/numeros-bloques', async (req, res) => {
  try {
    const prepare = preparerBlocage(req.body.telephone, req.body.motif);
    if (!prepare) {
      return res.status(400).json({ error: 'Numéro invalide.' });
    }

    // Se bloquer soi-même couperait la ligne : Twilio ne pourrait plus
    // joindre Elena, et plus aucune consultation n'aboutirait.
    const { data: consultant } = await supabase
      .from('consultants')
      .select('user_id')
      .limit(1)
      .maybeSingle();
    if (consultant?.user_id) {
      const { data: u } = await supabase
        .from('users')
        .select('phone')
        .eq('id', consultant.user_id)
        .maybeSingle();
      if (u?.phone && memeNumero(u.phone, prepare.telephone)) {
        return res.status(400).json({
          error:
            'Ce numéro est le vôtre : le bloquer rendrait toute consultation impossible.',
        });
      }
    }

    const { data, error } = await supabase
      .from('numeros_bloques')
      .upsert(prepare, { onConflict: 'chiffres' })
      .select('id, telephone, motif, bloque_le')
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Erreur blocage numéro:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/numeros-bloques/:id
router.delete('/numeros-bloques/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('numeros_bloques')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    console.error('Erreur déblocage numéro:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/reglages - Taux fiscaux et seuils de pilotage
//
// Ils vivaient dans le localStorage. Un navigateur changé, un cache vidé,
// et les taux repartaient au défaut sans prévenir — ou pire, restaient
// figés sur une ancienne valeur pendant que le code évoluait.
router.patch('/reglages', async (req, res) => {
  try {
    const p = await getPraticienne();
    const actuel = p.config_tarifs || {};

    // borner() applique les mêmes plafonds que le navigateur, mais ici
    // rien ne peut les contourner.
    const reglages = bornerReglages({
      ...bornerReglages(actuel.reglages),
      ...req.body,
    });

    const { error } = await supabase
      .from('praticiennes')
      .update({ config_tarifs: { ...actuel, reglages } })
      .eq('id', p.id);
    if (error) throw error;

    clearCache();
    res.json({ reglages, message: 'Réglages enregistrés.' });
  } catch (err) {
    console.error('Erreur mise à jour réglages:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/textes - Baseline, signature, message d'absence
router.patch('/textes', async (req, res) => {
  try {
    const p = await getPraticienne();
    const b = { ...(p.config_branding || {}) };

    const texte = (v, max) =>
      typeof v === 'string' ? v.trim().slice(0, max) : null;

    if ('tagline' in req.body) {
      const v = texte(req.body.tagline, 200);
      if (v === null) return res.status(400).json({ error: 'Baseline invalide.' });
      b.tagline = v;
    }
    if ('signature' in req.body) {
      const v = texte(req.body.signature, 300);
      if (v === null) return res.status(400).json({ error: 'Signature invalide.' });
      b.signature = v;
    }
    if ('messageAbsence' in req.body) {
      const v = texte(req.body.messageAbsence, 300);
      if (v === null) return res.status(400).json({ error: "Message d'absence invalide." });
      b.message_absence = v;
    }
    // ABSENCE PROGRAMMÉE — deux dates, et le message normal revient tout
    // seul après. Sans elles, il faut penser à le retirer au retour : on
    // l'oublie, et les clientes lisent « je reviens jeudi » en novembre.
    for (const [cle, champ] of [
      ['absenceDebut', 'absence_debut'],
      ['absenceFin', 'absence_fin'],
    ]) {
      if (cle in req.body) {
        const v = req.body[cle];
        if (v === null || v === '') {
          b[champ] = null;
        } else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
          b[champ] = v;
        } else {
          return res.status(400).json({ error: `Date invalide pour ${cle}.` });
        }
      }
    }
    if (b.absence_debut && b.absence_fin && b.absence_fin < b.absence_debut) {
      return res.status(400).json({
        error: 'La date de retour précède la date de départ.',
      });
    }

    if ('heuresIndicatives' in req.body) {
      // « Je suis généralement en ligne en soirée » — un texte libre, pas
      // un planning : affiché aux clientes quand Elena est hors ligne.
      const v = texte(req.body.heuresIndicatives, 160);
      if (v === null) return res.status(400).json({ error: 'Heures indicatives invalides.' });
      b.heures_indicatives = v;
    }

    const { error } = await supabase
      .from('praticiennes')
      .update({ config_branding: b })
      .eq('id', p.id);
    if (error) throw error;

    clearCache();
    res.json({ message: 'Textes mis à jour.' });
  } catch (err) {
    console.error('Erreur mise à jour textes:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// SANTÉ DE LA LIGNE — solde Twilio et auto-test de joignabilité.
// Une ligne à sec fait échouer les appels en silence : ce voyant
// évite d'ouvrir la permanence avec un tuyau cassé.
// ------------------------------------------------------------------

async function soldeTwilio() {
  if (!twilio) return { disponible: false, raison: 'Twilio non configuré' };
  try {
    const balance = await twilio.balance.fetch();
    const montant = parseFloat(balance.balance);
    return {
      disponible: true,
      montant,
      devise: balance.currency || 'USD',
    };
  } catch (err) {
    // Compte post-payé ou permission absente : ce n'est pas une panne
    return { disponible: false, raison: err.message };
  }
}

// GET /api/admin/ligne - Solde Twilio + estimation en minutes
router.get('/ligne', async (req, res) => {
  try {
    const solde = await soldeTwilio();

    // Estimation prudente : ~0,03 €/min pour DEUX jambes d'appel
    // (Twilio facture chaque jambe séparément).
    const COUT_MINUTE_ESTIME = 0.03;
    let minutesEstimees = null;
    if (solde.disponible && typeof solde.montant === 'number') {
      minutesEstimees = Math.floor(solde.montant / COUT_MINUTE_ESTIME);
    }

    res.json({
      ...solde,
      minutesEstimees,
      coutMinuteEstime: COUT_MINUTE_ESTIME,
      numeroLigne: process.env.TWILIO_PHONE_NUMBER || null,
    });
  } catch (err) {
    console.error('Erreur solde ligne:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/essai-ligne - « Vérifier ma ligne » : un VRAI appel.
//
// L'autotest ci-dessous vérifie la configuration ; il ne fait pas sonner
// le téléphone. Or c'est le seul moyen de savoir que tout fonctionne
// sans attendre une vraie cliente — et de découvrir, par exemple, qu'un
// opérateur bloque les appels ou que le numéro enregistré est faux.
router.post('/essai-ligne', async (req, res) => {
  try {
    if (!twilio) {
      return res.status(503).json({ error: 'Twilio non configuré.' });
    }

    const p = await getPraticienne();
    const utilisateur = await utilisateurPraticienne(p.id);
    const numero = normalizePhone(utilisateur?.phone);
    if (!numero) {
      return res.status(400).json({
        error: "Aucun numéro personnel enregistré. Renseignez-le d'abord ci-dessus.",
      });
    }

    // Se prémunir du cas où son numéro personnel serait celui de la
    // ligne : Twilio refuse d'appeler un numéro depuis lui-même, et
    // l'échec serait silencieux.
    if (memeNumero(numero, process.env.TWILIO_PHONE_NUMBER)) {
      return res.status(400).json({
        error:
          "Votre numéro personnel est identique à celui de la ligne : l'appel ne peut pas aboutir.",
      });
    }

    const backendUrl = (
      process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`
    ).replace(/\/+$/, '');

    await twilio.calls.create({
      to: numero,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${backendUrl}/api/calls/twiml/essai`,
      method: 'GET', // /twiml/essai est une route GET (défaut Twilio = POST)
      timeLimit: 120, // filet : un test ne doit jamais consommer plus
    });

    res.json({
      message:
        'Votre téléphone va sonner. Décrochez : vous entendrez ce que vos clientes entendent.',
    });
  } catch (err) {
    console.error('Erreur essai de ligne:', err);
    res.status(500).json({ error: err.message || "L'appel de test n'a pas pu partir." });
  }
});

// GET /api/admin/autotest - « Suis-je joignable ? »
router.get('/autotest', async (req, res) => {
  const controles = [];

  // 1. Numéro de la ligne configuré
  const numeroLigne = process.env.TWILIO_PHONE_NUMBER || null;
  controles.push({
    cle: 'numero_ligne',
    libelle: 'Numéro de la ligne configuré',
    ok: !!numeroLigne,
    detail: numeroLigne || 'TWILIO_PHONE_NUMBER absent',
  });

  // 2. Twilio joignable + solde
  const solde = await soldeTwilio();
  if (solde.disponible) {
    const suffisant = solde.montant > 1;
    controles.push({
      cle: 'solde_twilio',
      libelle: 'Solde Twilio',
      ok: suffisant,
      detail: `${solde.montant.toFixed(2)} ${solde.devise}${suffisant ? '' : ' — trop bas pour tenir un appel'}`,
    });
  } else {
    controles.push({
      cle: 'solde_twilio',
      libelle: 'Solde Twilio',
      ok: !!twilio, // compte post-payé : Twilio répond mais pas de solde
      detail: twilio ? 'Solde non lisible (compte post-payé ?)' : 'Twilio non configuré',
    });
  }

  // 3. Numéro personnel de la praticienne
  try {
    const p = await getPraticienne();
    const { data: consultant } = await supabase
      .from('consultants')
      .select('user_id')
      .eq('praticienne_id', p.id)
      .limit(1)
      .maybeSingle();

    let tel = null;
    if (consultant?.user_id) {
      const { data: u } = await supabase
        .from('users')
        .select('phone')
        .eq('id', consultant.user_id)
        .maybeSingle();
      tel = u?.phone || null;
    }

    const memeQueLigne =
      tel && numeroLigne && tel.replace(/\D/g, '') === numeroLigne.replace(/\D/g, '');

    controles.push({
      cle: 'numero_praticienne',
      libelle: 'Votre numéro personnel',
      ok: !!tel && !memeQueLigne,
      detail: !tel
        ? 'Aucun numéro enregistré : vous ne pouvez pas être appelée'
        : memeQueLigne
        ? 'Identique au numéro de la ligne : Twilio ne peut pas vous joindre'
        : tel,
    });
  } catch (e) {
    controles.push({
      cle: 'numero_praticienne',
      libelle: 'Votre numéro personnel',
      ok: false,
      detail: 'Vérification impossible',
    });
  }

  // 4. URL publique du backend (indispensable aux callbacks Twilio)
  const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
  controles.push({
    cle: 'backend_url',
    libelle: 'Adresse publique du serveur',
    ok: /^https:\/\//.test(backendUrl),
    detail: backendUrl || 'BACKEND_URL absent — les appels ne peuvent pas aboutir',
  });

  // 5. Base de données
  try {
    const { error } = await supabase.from('praticiennes').select('id').limit(1);
    controles.push({
      cle: 'base',
      libelle: 'Base de données',
      ok: !error,
      detail: error ? error.message : 'Connectée',
    });
  } catch (e) {
    controles.push({ cle: 'base', libelle: 'Base de données', ok: false, detail: 'Injoignable' });
  }

  res.json({
    pret: controles.every((c) => c.ok),
    controles,
    testeLe: new Date().toISOString(),
  });
});

module.exports = router;
