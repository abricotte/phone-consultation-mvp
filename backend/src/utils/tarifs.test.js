// Garde-fous tarifaires : ils doivent refuser les erreurs de saisie qui
// coûtent de l'argent, sans gêner les tarifs légitimes.
//
//   node src/utils/tarifs.test.js

const assert = require('assert');
const { verifierPrixMinute, verifierForfait } = require('./tarifs');
const { borner, REGLAGES_DEFAUT } = require('./reglages');

let ok = 0;
function refuse(message, valeur) {
  assert.ok(valeur !== null, `Aurait dû être REFUSÉ : ${message}`);
  ok++;
}
function accepte(message, valeur) {
  assert.strictEqual(valeur, null, `Aurait dû être ACCEPTÉ : ${message} — ${valeur}`);
  ok++;
}

// ── Prix à la minute : bornes dures [1 € ; 5 €] ────────────────────────
accepte('2,90 €/min, le tarif réel', verifierPrixMinute(2.9));
accepte('1,00 €/min, la borne basse', verifierPrixMinute(1));
accepte('5,00 €/min, la borne haute', verifierPrixMinute(5));
refuse('0,90 €/min, sous la borne', verifierPrixMinute(0.9));
refuse('5,10 €/min, au-dessus', verifierPrixMinute(5.1));
refuse('29 €/min — virgule oubliée sur 2,90', verifierPrixMinute(29));
refuse('0,29 €/min — virgule déplacée', verifierPrixMinute(0.29));
refuse('texte', verifierPrixMinute('deux euros'));
refuse('vide', verifierPrixMinute(undefined));

// ── Forfaits : cohérence avec le tarif à la minute ─────────────────────
const PRIX = 2.9;

accepte(
  'Découverte 20 min à 58 € (2,90 €/min)',
  verifierForfait({ nom: 'Découverte', minutes: 20, prix: 58 }, PRIX)
);
accepte(
  'Complète 45 min à 129 € (2,87 €/min)',
  verifierForfait({ nom: 'Complète', minutes: 45, prix: 129 }, PRIX)
);
accepte(
  'remise franche : 60 min à 90 € (1,50 €/min, pile 51,7 %)',
  verifierForfait({ nom: 'Longue', minutes: 60, prix: 90 }, PRIX)
);

// LE cas de l'énoncé : 12 € tapé au lieu de 129 € → 0,27 €/min
const faute = verifierForfait({ nom: 'Complète', minutes: 45, prix: 12 }, PRIX);
refuse('45 min à 12 € au lieu de 129 €', faute);
assert.ok(
  faute.includes('0.27') && faute.includes('129') === false,
  'Le message doit montrer le prix/minute implicite qui alerte'
);
assert.ok(
  faute.includes('Complète') && faute.includes('12 € pour 45 min'),
  'Le message doit nommer le forfait et rappeler ce qui a été saisi'
);
ok++;

refuse(
  'un zéro de trop en moins : 30 min à 5 €',
  verifierForfait({ nom: 'Express', minutes: 30, prix: 5 }, PRIX)
);

// ── Réglages : bornage et reprise de l'ancien 23 % ─────────────────────
assert.strictEqual(borner({}).urssaf, 26, 'Le défaut URSSAF doit être 26 %');
assert.strictEqual(borner({ urssaf: 23 }).urssaf, 23, 'Une valeur explicite est respectée');
assert.strictEqual(borner({ urssaf: 900 }).urssaf, 60, 'Une valeur aberrante est plafonnée');
assert.strictEqual(borner({ urssaf: 'oups' }).urssaf, 26, 'Un texte retombe sur le défaut');
assert.strictEqual(borner({ tvaActive: false }).tvaActive, false, 'La TVA peut être désactivée');
assert.strictEqual(borner(null).impot, REGLAGES_DEFAUT.impot, 'null ne casse rien');
ok += 6;

console.log(`✓ ${ok} vérifications passent.`);
console.log(`  dont le cas « 12 € au lieu de 129 € » : refusé, avec le message`);
console.log(`  → ${faute}`);
