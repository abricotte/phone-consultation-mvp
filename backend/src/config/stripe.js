const Stripe = require('stripe');

let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY manquant - Stripe désactivé');
}

module.exports = stripe;
