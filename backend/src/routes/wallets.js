const express = require('express');
const supabase = require('../config/supabase');
const stripe = require('../config/stripe');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/wallets/me - Voir son solde
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('id, balance, updated_at')
      .eq('user_id', req.user.id)
      .single();

    if (error || !wallet) {
      return res.status(404).json({ error: 'Portefeuille non trouvé' });
    }

    res.json({
      id: wallet.id,
      balance: wallet.balance,
      updatedAt: wallet.updated_at,
    });
  } catch (err) {
    console.error('Erreur wallet:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/wallets/topup - Créer une session Stripe Checkout
router.post('/topup', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Montant minimum : 1€' });
    }

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!wallet) {
      return res.status(404).json({ error: 'Portefeuille non trouvé' });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe non configuré. Vérifiez STRIPE_SECRET_KEY.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Rechargement ConsultPhone',
              description: `Rechargement de ${amount}€ sur votre portefeuille`,
            },
            unit_amount: Math.round(amount * 100), // Stripe = centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: req.user.id,
        wallet_id: wallet.id,
        amount: amount.toString(),
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Erreur création paiement Stripe:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la création du paiement' });
  }
});

// GET /api/wallets/transactions - Historique des transactions
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!wallet) {
      return res.status(404).json({ error: 'Portefeuille non trouvé' });
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, type, amount, description, created_at')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      createdAt: t.created_at,
    })));
  } catch (err) {
    console.error('Erreur transactions:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
