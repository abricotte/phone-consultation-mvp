const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
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
