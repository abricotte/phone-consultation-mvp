const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const twilio = require('../config/twilio');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimits');

const router = express.Router();

// Règle de mot de passe — VÉRIFIÉE CÔTÉ SERVEUR (source de vérité).
const MDP_MIN = 8;
function motDePasseInvalide(pwd) {
  if (typeof pwd !== 'string' || pwd.length < MDP_MIN) {
    return `Le mot de passe doit contenir au moins ${MDP_MIN} caractères.`;
  }
  return null;
}

// Source unique de normalisation (cf. utils/telephone.js)
const {
  normaliser: normalizePhone,
  estNumeroFrancais,
  memeNumero,
} = require('../utils/telephone');

// POST /api/auth/register - Inscription
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const erreurMdp = motDePasseInvalide(password);
    if (erreurMdp) {
      return res.status(400).json({ error: erreurMdp });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const telNormalise = normalizePhone(phone);

    // ----------------------------------------------------------------
    // REPRISE D'UNE FICHE CRÉÉE PAR CALENDLY
    //
    // Une réservation Calendly crée une fiche pour quelqu'un qui n'a rien
    // demandé, afin que son historique et ses notes existent. Si cette
    // personne s'inscrit ensuite, elle ne doit PAS obtenir un second
    // compte : son historique serait coupé en deux, et l'ancienne
    // réponse « Cet email est déjà utilisé » l'aurait purement et
    // simplement bloquée.
    //
    // On reprend par email, puis par numéro — mais JAMAIS une fiche
    // issue d'une vraie inscription : celle-là appartient à quelqu'un.
    // ----------------------------------------------------------------
    const { data: parEmail } = await supabase
      .from('users')
      .select('id, origine')
      .ilike('email', email)
      .maybeSingle();

    let aReprendre = parEmail?.origine === 'calendly' ? parEmail : null;

    if (parEmail && !aReprendre) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    if (!aReprendre && telNormalise) {
      const { data: candidats } = await supabase
        .from('users')
        .select('id, phone, origine')
        .eq('origine', 'calendly');
      const trouvee = (candidats || []).find((u) => memeNumero(u.phone, telNormalise));
      if (trouvee) aReprendre = trouvee;
    }

    if (aReprendre) {
      const { data: reprise, error: erreurReprise } = await supabase
        .from('users')
        .update({
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone: telNormalise || null,
          origine: 'inscription',
        })
        .eq('id', aReprendre.id)
        .eq('origine', 'calendly') // garde-fou : ne jamais écraser un vrai compte
        .select('id, email, first_name, last_name, role')
        .maybeSingle();

      if (erreurReprise) throw erreurReprise;

      if (reprise) {
        console.log(`Inscription : fiche Calendly ${reprise.id} reprise, historique conservé`);

        // Le portefeuille existe déjà (créé avec la fiche) — on ne le
        // recrée pas, au risque d'en avoir deux et de perdre un solde.
        const { data: portefeuille } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', reprise.id)
          .maybeSingle();
        if (!portefeuille) {
          await supabase.from('wallets').insert({ user_id: reprise.id });
        }

        const token = jwt.sign(
          { id: reprise.id, email: reprise.email, role: reprise.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(201).json({
          token,
          user: {
            id: reprise.id,
            email: reprise.email,
            firstName: reprise.first_name,
            lastName: reprise.last_name,
            role: reprise.role,
          },
        });
      }
    }
    // L'inscription publique ne crée QUE des clientes. Les rôles
    // consultant/admin sont attribués manuellement en base.
    const userRole = 'client';

    // Créer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        // Normalisé dès l'inscription : sans cela, la même personne
        // n'est pas reconnue selon le format qu'elle a tapé.
        phone: telNormalise || null,
        role: userRole,
      })
      .select()
      .single();

    if (userError) throw userError;

    // Créer le portefeuille
    const { error: walletError } = await supabase
      .from('wallets')
      .insert({ user_id: user.id });

    if (walletError) throw walletError;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login - Connexion
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Erreur connexion:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me - Profil de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Erreur profil:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/change-password - Changer son mot de passe (connectée)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Mot de passe actuel et nouveau mot de passe requis.',
      });
    }

    const erreurMdp = motDePasseInvalide(newPassword);
    if (erreurMdp) {
      return res.status(400).json({ error: erreurMdp });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        error: 'Le nouveau mot de passe doit être différent de l\'actuel.',
      });
    }

    // Récupérer le hash actuel pour vérifier le mot de passe fourni
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const valide = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valide) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    const nouveauHash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: nouveauHash })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('Erreur changement mot de passe:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ------------------------------------------------------------------
// MOT DE PASSE OUBLIÉ — PAR APPEL, POUR TOUT COMPTE.
//
// Pas d'email sortant sur la plateforme (Resend n'est pas branché) : le
// code est DICTÉ par téléphone, sur le numéro enregistré du compte —
// chaque cliente en a un, c'est celui que l'espace appelle pour
// consulter. Même mécanique que la vérification d'un nouveau numéro.
// Qui tient ce téléphone peut choisir un nouveau mot de passe, personne
// d'autre.
//
// Rien n'est confirmé à un inconnu : même réponse que l'adresse existe
// ou non, et l'appel ne part que si elle existe.
// ------------------------------------------------------------------

async function utilisateurParEmail(email) {
  if (typeof email !== 'string' || !email.trim()) return null;
  const { data } = await supabase
    .from('users')
    .select('id, email, phone, first_name, last_name, role')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  return data || null;
}

/** « 06 ** ** ** 12 » — assez pour se reconnaître, pas pour composer */
function masquerTel(n) {
  const chiffres = String(n || '').replace(/\D/g, '');
  if (chiffres.length < 6) return '(numéro incomplet)';
  const fin = chiffres.slice(-2);
  const debut = chiffres.startsWith('33') ? '0' + chiffres.charAt(2) : chiffres.slice(0, 2);
  return `${debut} ** ** ** ${fin}`;
}

const REPONSE_NEUTRE =
  "Si cette adresse correspond à un compte, le téléphone qui y est enregistré sonne dans quelques secondes et dicte un code.";

// POST /api/auth/mot-de-passe/demander
router.post('/mot-de-passe/demander', loginLimiter, async (req, res) => {
  try {
    const user = await utilisateurParEmail(req.body?.email);
    if (!user || !user.phone) {
      return res.json({ message: REPONSE_NEUTRE });
    }
    if (!twilio) {
      return res.status(503).json({ error: 'Téléphonie non configurée.' });
    }
    // Un numéro enregistré avant la normalisation, ou un numéro de test,
    // ferait échouer l'appel en silence : on le dit, avec le numéro
    // masqué — la personne qui connaît l'email sait aussi son numéro.
    const telephone = normalizePhone(user.phone);
    if (!telephone || !estNumeroFrancais(telephone)) {
      return res.status(422).json({
        error: `Le numéro enregistré sur ce compte (${masquerTel(user.phone)}) n'est pas un numéro français joignable. Écrivez à Elena pour le corriger.`,
      });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expire = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Une seule attente à la fois (même table que la vérification de numéro)
    await supabase.from('verifications_numero').delete().eq('user_id', user.id);
    const { data: verif, error } = await supabase
      .from('verifications_numero')
      .insert({ user_id: user.id, telephone: user.phone, code, expire_le: expire })
      .select('id')
      .single();
    if (error) throw error;

    const backendUrl = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
    try {
      const appel = await twilio.calls.create({
        to: telephone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${backendUrl}/api/calls/twiml/verification?id=${verif.id}&motif=mdp`,
        method: 'GET',
        timeLimit: 60,
      });
      await supabase.from('verifications_numero').update({ call_sid: appel.sid }).eq('id', verif.id);
    } catch (twErr) {
      await supabase.from('verifications_numero').delete().eq('id', verif.id);
      // Le code Twilio dans les journaux : 21211 = numéro invalide,
      // 21215 = destination non autorisée sur le compte, 20003 = clés.
      console.error(
        `Appel mot de passe oublié impossible (code ${twErr.code || '?'}, vers ${masquerTel(telephone)}):`,
        twErr.message
      );
      const raison =
        twErr.code === 21211 || twErr.code === 21214
          ? `Le numéro enregistré sur ce compte (${masquerTel(telephone)}) est refusé par la téléphonie. Écrivez à Elena pour le corriger.`
          : "L'appel n'a pas pu partir. Réessayez dans un instant.";
      return res.status(502).json({ error: raison });
    }

    console.log(`Mot de passe oublié : appel lancé (${user.role})`);
    res.json({ message: REPONSE_NEUTRE, expireDans: 600 });
  } catch (err) {
    console.error('Erreur mot de passe oublié (demande):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/mot-de-passe/confirmer - code dicté + nouveau mot de passe
router.post('/mot-de-passe/confirmer', loginLimiter, async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim();
    const nouveau = req.body?.nouveauMotDePasse;
    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({ error: 'Code à 4 chiffres attendu.' });
    }
    const erreurMdp = motDePasseInvalide(nouveau);
    if (erreurMdp) return res.status(400).json({ error: erreurMdp });

    const user = await utilisateurParEmail(req.body?.email);
    if (!user) return res.status(401).json({ error: 'Code incorrect.' });

    const { data: verif } = await supabase
      .from('verifications_numero')
      .select('id, telephone, code, tentatives, expire_le')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!verif || verif.telephone !== user.phone) {
      return res.status(404).json({ error: 'Aucune demande en cours. Demandez un nouveau code.' });
    }
    if (new Date(verif.expire_le) < new Date()) {
      await supabase.from('verifications_numero').delete().eq('id', verif.id);
      return res.status(410).json({ error: 'Code expiré. Demandez un nouveau code.' });
    }
    if (verif.tentatives >= 5) {
      await supabase.from('verifications_numero').delete().eq('id', verif.id);
      return res.status(429).json({ error: 'Trop de tentatives. Demandez un nouveau code.' });
    }
    if (verif.code !== code) {
      await supabase
        .from('verifications_numero')
        .update({ tentatives: verif.tentatives + 1 })
        .eq('id', verif.id);
      const restants = 4 - verif.tentatives;
      return res.status(401).json({
        error: `Code incorrect (${restants} essai${restants > 1 ? 's' : ''} restant${restants > 1 ? 's' : ''}).`,
      });
    }

    const hash = await bcrypt.hash(nouveau, 10);
    const { error: majErr } = await supabase
      .from('users')
      .update({ password_hash: hash })
      .eq('id', user.id);
    if (majErr) throw majErr;
    await supabase.from('verifications_numero').delete().eq('id', verif.id);
    console.log(`Mot de passe changé par appel (${user.role})`);

    // Elle entre directement : le code dicté vaut la preuve.
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      message: 'Nouveau mot de passe enregistré.',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Erreur mot de passe oublié (confirmation):', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/auth/phone - Modifier son numéro de téléphone (connectée)
router.patch('/phone', authMiddleware, async (req, res) => {
  try {
    const normalized = normalizePhone(req.body.phone);

    if (!normalized || !estNumeroFrancais(normalized)) {
      return res.status(400).json({
        error:
          'Numéro invalide. Indiquez un numéro français (ex. 06 12 34 56 78) ou international (ex. +33 6 12 34 56 78).',
      });
    }

    const { error } = await supabase
      .from('users')
      .update({ phone: normalized })
      .eq('id', req.user.id);

    if (error) throw error;

    res.json({ phone: normalized, message: 'Numéro de téléphone mis à jour.' });
  } catch (err) {
    console.error('Erreur modification téléphone:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
