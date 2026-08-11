// Vérifie qu'un seul appel ne peut donner qu'UN SEUL débit.
//
// Contexte : Twilio notifie la fin d'un appel pour CHAQUE jambe (la cliente
// et la praticienne), et la conférence notifie de son côté. finalizeSession
// peut donc s'exécuter trois fois en parallèle. Le 10 août 2026, une cliente
// a été débitée deux fois 8,70 € pour une seule consultation de 3 min.
//
// Le test simule cette concurrence avec une base factice qui rend la main
// entre chaque opération — exactement ce qui laissait les trois exécutions
// lire « active » avant que la première n'écrive.
//
//   node src/routes/calls.race.test.js

const assert = require('assert');

// ── Base factice ────────────────────────────────────────────────────────
// `respecterCondition: false` reproduit l'ancien comportement (l'UPDATE
// s'applique sans vérifier le statut). Cela sert à prouver que le test a
// des dents : sans la prise atomique, il DOIT échouer.
function creerBase({ respecterCondition }) {
  const etat = {
    session: {
      id: 'sess-1',
      type: 'minute',
      status: 'active',
      started_at: new Date(Date.now() - 125_000).toISOString(), // 2 min 05
      rate_per_minute: '2.90',
      client_id: 'cli-1',
      montant_paye: null,
    },
    wallet: { id: 'w-1', balance: '29.00' },
    transactions: [],
  };

  // Rend la main à la boucle d'événements : c'est ce point de bascule qui
  // permet aux exécutions concurrentes de s'entrelacer, comme en vrai.
  const souffler = () => new Promise((r) => setImmediate(r));

  function executer(q) {
    return souffler().then(() => {
      if (q.table === 'sessions') {
        if (q.op === 'select') return { data: { ...etat.session } };
        if (q.op === 'update') {
          const conditionne = q.statutsAcceptes !== null;
          const autorise =
            !conditionne ||
            !respecterCondition ||
            q.statutsAcceptes.includes(etat.session.status);

          if (!autorise) return { data: [] }; // perdant : aucune ligne touchée
          Object.assign(etat.session, q.payload);
          return { data: [{ id: etat.session.id }] };
        }
      }
      if (q.table === 'wallets') {
        if (q.op === 'select') return { data: { ...etat.wallet } };
        if (q.op === 'update') {
          Object.assign(etat.wallet, q.payload);
          return { data: [{ id: etat.wallet.id }] };
        }
      }
      if (q.table === 'transactions' && q.op === 'insert') {
        etat.transactions.push(q.payload);
        return { data: [q.payload] };
      }
      return { data: null }; // praticiennes, etc. — hors sujet ici
    });
  }

  const client = {
    from(table) {
      const q = { table, op: null, payload: null, statutsAcceptes: null };
      q.select = () => { q.op = q.op || 'select'; return q; };
      q.update = (p) => { q.op = 'update'; q.payload = p; return q; };
      q.insert = (p) => { q.op = 'insert'; q.payload = p; return q; };
      q.eq = () => q;
      q.in = (_col, vals) => { q.statutsAcceptes = vals; return q; };
      q.single = () => q;
      q.then = (ok, ko) => executer(q).then(ok, ko);
      return q;
    },
  };

  return { client, etat };
}

// Charge calls.js avec la base factice injectée à la place de Supabase.
function chargerAvec(client) {
  const cheminSupabase = require.resolve('../config/supabase');
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  require.cache[cheminSupabase] = { id: cheminSupabase, filename: cheminSupabase, loaded: true, exports: client };
  return require('./calls').__test__;
}

// ── Scénario ────────────────────────────────────────────────────────────
// Trois notifications simultanées pour un seul appel de 2 min 05
// → 3 minutes entamées × 2,90 € = 8,70 €, débité UNE fois.
async function scenario(respecterCondition) {
  const { client, etat } = creerBase({ respecterCondition });
  const { finalizeSession } = chargerAvec(client);
  await Promise.all([
    finalizeSession('sess-1'),
    finalizeSession('sess-1'),
    finalizeSession('sess-1'),
  ]);
  return etat;
}

(async () => {
  // 1. Le test a-t-il des dents ? Sans la prise atomique, il doit voir le bug.
  const sansProtection = await scenario(false);
  assert.ok(
    sansProtection.transactions.length > 1,
    'Le test ne détecte pas le bug qu\'il est censé détecter — harnais à revoir.'
  );
  console.log(
    `✓ harnais valide : sans prise atomique, ${sansProtection.transactions.length} débits sont bien observés`
  );

  // 2. Le vrai code.
  const reel = await scenario(true);

  assert.strictEqual(
    reel.transactions.length, 1,
    `Double débit : ${reel.transactions.length} transactions pour un seul appel.`
  );
  assert.strictEqual(Number(reel.transactions[0].amount).toFixed(2), '8.70');
  assert.strictEqual(reel.transactions[0].description, 'Consultation téléphonique - 3 min');
  assert.strictEqual(Number(reel.wallet.balance).toFixed(2), '20.30'); // 29,00 − 8,70
  assert.strictEqual(reel.session.status, 'completed');

  console.log('✓ 3 notifications simultanées → 1 seul débit de 8,70 €');
  console.log(`✓ solde : 29,00 € → ${Number(reel.wallet.balance).toFixed(2)} €`);
  console.log('\n✓ Tous les tests passent.');
})().catch((err) => {
  console.error('\n✗ ÉCHEC :', err.message);
  process.exit(1);
});
