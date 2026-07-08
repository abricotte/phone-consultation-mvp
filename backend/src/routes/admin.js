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

// Réservé à la praticienne (rôle consultant) et aux admins
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'consultant') {
    return res.status(403).json({ error: 'Accès réservé' });
  }
  next();
}

router.use(authMiddleware, adminOnly);

// Normaliser un numéro FR au format international (identique à calls.js)
function normalizePhone(phone) {
  if (!phone) return phone;
  let cleaned = phone.replace(/[\s\-\.]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+33' + cleaned.substring(1);
  }
  if (cleaned.startsWith('33') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

function estNumeroFrValide(phone) {
  return /^\+33[67]?\d{8,9}$/.test(phone) && phone.length === 12;
}

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

// GET /api/admin/statut - Statut actuel + forfaits disponibles
router.get('/statut', async (req, res) => {
  try {
    const statut = await getStatutEnLigne();
    const p = await getPraticienne();
    const tarifs = await getTarifs();
    res.json({
      statut: statut.statut,
      enLigne: statut.enLigne,
      enLigneDepuis: statut.enLigneDepuis,
      retourPrevu: statut.retourPrevu,
      autoOffHeures: p.auto_off_heures || 4,
      forfaits: tarifs.forfaits,
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
      .select('id, type, status, duration_seconds, total_cost, created_at')
      .eq('praticienne_id', p.id)
      .gte('created_at', debutJour.toISOString());

    if (sessionsError) throw sessionsError;

    const terminees = sessions.filter((s) => s.status === 'completed');
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
      appelsActifs: sessions.filter((s) => s.status === 'active').length,
      forfaitsManuels: sessions.filter((s) => s.type === 'forfait_manuel').length,
      dureeTotaleMinutes: Math.round(dureeTotaleSecondes / 60),
      revenusJour: Math.round(revenus * 100) / 100,
      soldesClientsTotal: Math.round(soldesClients * 100) / 100,
      nombreWallets: wallets.length,
    });
  } catch (err) {
    console.error('Erreur vue du jour:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
