const twilio = require('twilio');

let client = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  console.warn('TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN manquant - Twilio désactivé');
}

module.exports = client;
