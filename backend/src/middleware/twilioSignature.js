const twilio = require('twilio');

// Validation ACTIVE par défaut. Le flag n'existe que pour le debug local.
const VALIDATE = process.env.TWILIO_VALIDATE_SIGNATURE !== 'false';

// MOUCHARD DE DIAGNOSTIC (temporaire) : conserve en mémoire les derniers
// échecs de signature, avec UNIQUEMENT des infos non sensibles (jamais le
// token ni la signature). Lisible via GET /api/calls/_debug/signature.
const derniersEchecs = [];
function enregistrerEchec(info) {
  derniersEchecs.unshift(info);
  if (derniersEchecs.length > 10) derniersEchecs.pop();
}

// Pas de sécurité optionnelle en production : refus de démarrer.
if (process.env.NODE_ENV === 'production' && !VALIDATE) {
  console.error(
    'FATAL : TWILIO_VALIDATE_SIGNATURE est désactivé alors que NODE_ENV=production. ' +
      'La validation de signature Twilio est obligatoire en production. Arrêt du serveur.'
  );
  process.exit(1);
}

// Vérifie X-Twilio-Signature sur les callbacks Twilio (TwiML, statuts).
// Nécessite BACKEND_URL = URL publique exacte du backend (https).
function twilioSignature(req, res, next) {
  if (!VALIDATE) {
    console.warn(`Signature Twilio NON vérifiée (debug) : ${req.method} ${req.originalUrl}`);
    return next();
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('Signature Twilio : TWILIO_AUTH_TOKEN manquant, requête refusée');
    return res.status(503).send('Configuration Twilio manquante');
  }

  const signature = req.headers['x-twilio-signature'];
  // BACKEND_URL normalisé (barre oblique finale retirée) pour que l'URL
  // reconstruite corresponde EXACTEMENT à celle que Twilio a signée —
  // une "/" en trop suffit à faire échouer la validation.
  const base = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
  const url = `${base}${req.originalUrl}`;
  // POST : Twilio signe les paramètres du body (urlencoded).
  // GET : les paramètres sont dans l'URL, body vide.
  const params = req.method === 'POST' ? req.body || {} : {};

  const valide = twilio.validateRequest(authToken, signature, url, params);

  if (!valide) {
    // Log actionnable : URL reconstruite (non secrète) pour diagnostiquer
    // un BACKEND_URL erroné (protocole, hôte, barre finale).
    console.warn(
      `Signature Twilio INVALIDE : ${req.method} ${req.originalUrl} — URL reconstruite="${url}" — signature présente=${!!signature}`
    );
    enregistrerEchec({
      at: new Date().toISOString(),
      method: req.method,
      originalUrl: req.originalUrl,
      urlReconstruite: url,
      backendUrlBrut: process.env.BACKEND_URL || null,
      signaturePresente: !!signature,
      // 8 premiers caractères seulement (jamais la signature complète)
      signatureApercu: signature ? String(signature).slice(0, 8) + '…' : null,
      // en-têtes de proxy utiles pour comprendre ce que Railway transmet
      xForwardedProto: req.headers['x-forwarded-proto'] || null,
      xForwardedHost: req.headers['x-forwarded-host'] || null,
      host: req.headers.host || null,
    });
    return res.status(403).send('Signature Twilio invalide');
  }

  next();
}

module.exports = twilioSignature;
module.exports.derniersEchecs = derniersEchecs;
