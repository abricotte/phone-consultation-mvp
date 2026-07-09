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

// Normalisation du numéro de téléphone au format E.164 (le numéro sert à
// ÉMETTRE l'appel de consultation, il doit donc être composable).
const PHONE_E164 = /^\+[1-9]\d{7,14}$/;
function normalizePhone(phone) {
  if (typeof phone !== 'string') return null;
  let c = phone.replace(/[\s\-.()]/g, '');
  if (c.startsWith('00')) c = '+' + c.slice(2); // préfixe international 00 → +
  if (/^0\d{9}$/.test(c)) c = '+33' + c.slice(1); // format français 0X…
  if (/^33\d{9}$/.test(c)) c = '+' + c; // 33… sans le +
  return c;
}

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

    // Vérifier si l'email existe déjà
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
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
        phone: phone || null,
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

    if (!normalized || !PHONE_E164.test(normalized)) {
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
