// Vérifie qu'une recharge Stripe ne crédite qu'UNE fois, même renvoyée.
//
// Contexte : Stripe renvoie l'avis de paiement quand il n'a pas eu sa
// réponse à temps. Avant la migration 018, le serveur ajoutait l'argent au
// solde avant d'écrire la ligne protégée par l'index unique : au second
// envoi, 29 € payés devenaient 58 € de crédit.
//
// La base factice reproduit ce que fait crediter_recharge() : la ligne
// d'abord (refusée si le paiement est connu), le solde ensuite.
//
//   node src/routes/webhook.test.js

const assert = require('assert');

function creerBase({ panne = false } = {}) {
  const etat = { wallet: { id: 'w-1', balance: '14.50' }, transactions: [], appels: [] };
  const client = {
    rpc(nom, args) {
      etat.appels.push({ nom, args });
      return new Promise((r) => setImmediate(r)).then(() => {
        if (panne) return { data: null, error: { message: 'connexion perdue' } };
        if (nom !== 'crediter_recharge') return { data: null, error: { message: `rpc inconnue ${nom}` } };
        if (args.p_wallet_id !== etat.wallet.id) {
          return { data: null, error: { message: `crediter_recharge : portefeuille introuvable (${args.p_wallet_id})` } };
        }
        if (etat.transactions.some((t) => t.stripe_payment_id === args.p_stripe_payment_id)) return { data: null, error: null };
        etat.transactions.push({ type: 'credit', amount: args.p_montant, description: args.p_description, stripe_payment_id: args.p_stripe_payment_id });
        const cents = Math.round(Number(etat.wallet.balance) * 100) + Math.round(Number(args.p_montant) * 100);
        etat.wallet.balance = (cents / 100).toFixed(2);
        return { data: etat.wallet.balance, error: null };
      });
    },
    from() { throw new Error('le webhook ne doit plus lire ni écrire le solde lui-même'); },
  };
  return { client, etat };
}

// Charge webhook.js avec Stripe et Supabase factices
function chargerAvec(client, evenement) {
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const injecter = (chemin, exports) => {
    const c = require.resolve(chemin);
    require.cache[c] = { id: c, filename: c, loaded: true, exports };
  };
  injecter('../config/supabase', client);
  injecter('../config/stripe', { webhooks: { constructEvent: () => evenement } });
  const router = require('./webhook');
  const couche = router.stack.find((l) => l.route && l.route.path === '/stripe');
  const gestionnaires = couche.route.stack.map((s) => s.handle);
  return gestionnaires[gestionnaires.length - 1]; // après express.raw()
}

function appeler(gestionnaire) {
  return new Promise((resolve) => {
    const res = {
      statut: 200,
      status(c) { this.statut = c; return this; },
      json(corps) { resolve({ statut: this.statut, corps }); },
    };
    gestionnaire({ headers: { 'stripe-signature': 'x' }, body: Buffer.from('{}') }, res);
  });
}

const paiement = (metadata) => ({
  type: 'checkout.session.completed',
  data: { object: { payment_intent: 'pi_123', metadata } },
});

(async () => {
  // 1. Le même avis reçu deux fois, puis une troisième fois en même temps
  {
    const { client, etat } = creerBase();
    const g = chargerAvec(client, paiement({ user_id: 'u-1', wallet_id: 'w-1', amount: '29.00', minutes: '10' }));
    const r1 = await appeler(g);
    const [r2, r3] = await Promise.all([appeler(g), appeler(g)]);
    assert.deepStrictEqual([r1.statut, r2.statut, r3.statut], [200, 200, 200]);
    assert.strictEqual(etat.transactions.length, 1, `${etat.transactions.length} crédits pour un seul paiement`);
    assert.strictEqual(etat.wallet.balance, '43.50');
    assert.strictEqual(etat.appels[0].args.p_montant, '29.00');
    assert.strictEqual(etat.transactions[0].description, 'Rechargement Stripe - 29€');
    console.log('✓ avis Stripe reçu trois fois → crédité une fois (14,50 € → 43,50 €)');
  }

  // 2. Panne passagère de la base : 500, pour que Stripe réessaie
  {
    const { client } = creerBase({ panne: true });
    const g = chargerAvec(client, paiement({ user_id: 'u-1', wallet_id: 'w-1', amount: '29.00' }));
    const r = await appeler(g);
    assert.strictEqual(r.statut, 500);
    console.log('✓ panne de la base → 500 : Stripe réessaiera, sans risque de double crédit');
  }

  // 3. Portefeuille inconnu : 200 (réessayer n'y changerait rien), rien crédité
  {
    const { client, etat } = creerBase();
    const g = chargerAvec(client, paiement({ user_id: 'u-1', wallet_id: 'w-inconnu', amount: '29.00' }));
    const r = await appeler(g);
    assert.strictEqual(r.statut, 200);
    assert.strictEqual(etat.transactions.length, 0);
    console.log('✓ portefeuille inconnu → 200, rien crédité, signalé dans les journaux');
  }

  // 4. Montant illisible ou nul : rien n'est envoyé à la base
  for (const amount of [undefined, '', 'abc', '0', '-5']) {
    const { client, etat } = creerBase();
    const g = chargerAvec(client, paiement({ user_id: 'u-1', wallet_id: 'w-1', amount }));
    const r = await appeler(g);
    assert.strictEqual(r.statut, 200);
    assert.strictEqual(etat.appels.length, 0, `montant ${amount} envoyé à la base`);
  }
  console.log('✓ montant absent, illisible, nul ou négatif → rien crédité');

  // 5. Les centimes : 14,50 € reste 14.50, pas 14.499999
  {
    const { client, etat } = creerBase();
    const g = chargerAvec(client, paiement({ user_id: 'u-1', wallet_id: 'w-1', amount: '14.5' }));
    await appeler(g);
    assert.strictEqual(etat.appels[0].args.p_montant, '14.50');
    assert.strictEqual(etat.wallet.balance, '29.00');
    console.log('✓ montants envoyés en centimes exacts (« 14.50 »)');
  }

  console.log('\n✓ Tous les tests passent.');
})().catch((err) => {
  console.error('\n✗ ÉCHEC :', err.message);
  process.exit(1);
});
