const rateLimit = require('express-rate-limit');

const options = {
  standardHeaders: true,
  legacyHeaders: false,
};

// Connexion : 5 tentatives / 15 min / IP
const loginLimiter = rateLimit({
  ...options,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

// Inscription : 3 comptes / heure / IP
const registerLimiter = rateLimit({
  ...options,
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Trop d'inscriptions depuis cette adresse. Réessayez plus tard." },
});

// Recharge : 10 demandes / heure / IP
const topupLimiter = rateLimit({
  ...options,
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de demandes de recharge. Réessayez plus tard.' },
});

// Inscription aux notifications (anti-abus) : 5 / heure / IP
const notificationLimiter = rateLimit({
  ...options,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de demandes. Réessayez plus tard.' },
});

module.exports = { loginLimiter, registerLimiter, topupLimiter, notificationLimiter };
