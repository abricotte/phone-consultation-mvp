const express = require('express');
const stripe = require('../config/stripe');
const supabase = require('../config/supabase');

const router = express.Router();

// POST /api/webhook/stripe - Webhook Stripe (paiement confirmé)
// IMPORTANT : cette route utilise express.raw(), pas express.json()
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Erreur vérification webhook Stripe:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Traiter l'événement checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { user_id, wallet_id, amount } = session.metadata;

    try {
      const parsedAmount = parseFloat(amount);

      // Récupérer le solde actuel
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', wallet_id)
        .single();

      if (!wallet) {
        console.error('Wallet non trouvé:', wallet_id);
        return res.status(200).json({ received: true });
      }

      const newBalance = parseFloat(wallet.balance) + parsedAmount;

      // Mettre à jour le solde
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet_id);

      // Créer la transaction
      await supabase
        .from('transactions')
        .insert({
          wallet_id,
          type: 'credit',
          amount: parsedAmount,
          description: `Rechargement Stripe - ${parsedAmount}€`,
          stripe_payment_id: session.payment_intent,
        });

      console.log(`Paiement confirmé : +${parsedAmount}€ pour user ${user_id}`);
    } catch (err) {
      console.error('Erreur traitement webhook:', err);
    }
  }

  res.status(200).json({ received: true });
});

module.exports = router;
