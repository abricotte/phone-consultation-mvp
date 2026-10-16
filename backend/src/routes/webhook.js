const express = require('express');
const stripe = require('../config/stripe');
const supabase = require('../config/supabase');
const { centimes, versEuros } = require('../utils/argent');

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
  //
  // UNE RECHARGE = UN CRÉDIT, même si Stripe renvoie l'avis (il le fait
  // quand il n'a pas eu sa réponse à temps). crediter_recharge()
  // (migration 018) écrit d'abord la ligne de transaction, protégée par
  // l'index unique sur le paiement, et n'ajoute au solde que si la ligne
  // est nouvelle — le tout dans la base, en une seule fois : une fin
  // d'appel au même instant ne peut plus effacer la recharge.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { user_id, wallet_id, amount } = session.metadata || {};
    const cents = centimes(amount);

    if (!wallet_id || !Number.isFinite(cents) || cents <= 0) {
      // Rien à réessayer : l'avis lui-même est incomplet
      console.error(`Webhook Stripe : métadonnées inutilisables (wallet ${wallet_id}, montant ${amount}) — paiement ${session.payment_intent} À VÉRIFIER À LA MAIN`);
      return res.status(200).json({ received: true });
    }

    const { data: nouveauSolde, error } = await supabase.rpc('crediter_recharge', {
      p_wallet_id: wallet_id,
      p_montant: versEuros(cents),
      p_stripe_payment_id: session.payment_intent,
      p_description: `Rechargement Stripe - ${Number(versEuros(cents))}€`,
    });

    if (error) {
      if (/portefeuille introuvable/.test(error.message || '')) {
        // Réessayer n'y changera rien
        console.error(`Webhook Stripe : portefeuille ${wallet_id} introuvable — paiement ${session.payment_intent} À VÉRIFIER À LA MAIN`);
        return res.status(200).json({ received: true });
      }
      // Panne passagère : Stripe réessaiera, et le réessai ne peut pas
      // créditer deux fois
      console.error('Erreur traitement webhook:', error.message);
      return res.status(500).json({ error: 'Crédit non enregistré, réessayer' });
    }

    if (nouveauSolde === null) {
      console.log(`Webhook Stripe : paiement ${session.payment_intent} déjà crédité — rien à faire`);
    } else {
      console.log(`Paiement confirmé : +${versEuros(cents)}€ pour user ${user_id}`);
    }
  }

  res.status(200).json({ received: true });
});

module.exports = router;
