const twilio = require('twilio');

// Validation ACTIVE par défaut. Le flag n'existe que pour le debug local.
const VALIDATE = process.env.TWILIO_VALIDATE_SIGNATURE !== 'false';

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
  const url = `${process.env.BACKEND_URL}${req.originalUrl}`;
  // POST : Twilio signe les paramètres du body (urlencoded).
  // GET : les paramètres sont dans l'URL, body vide.
  const params = req.method === 'POST' ? req.body || {} : {};

  const valide = twilio.validateRequest(authToken, signature, url, params);

  if (!valide) {
    console.warn(`Signature Twilio INVALIDE : ${req.method} ${req.originalUrl}`);
    return res.status(403).send('Signature Twilio invalide');
  }

  next();
}

module.exports = twilioSignature;
