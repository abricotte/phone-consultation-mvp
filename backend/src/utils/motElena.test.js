// La date floue du mot d'Elena — calcul CALENDAIRE en heure de Paris.
//
//   node src/utils/motElena.test.js

const assert = require('assert');
const { dateFloue, nettoyerMot } = require('./motElena');

let ok = 0;
const cas = (attendu, publieLe, maintenant, libelle) => {
  const r = dateFloue(publieLe, maintenant);
  assert.strictEqual(r, attendu, `${libelle} → attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(r)}`);
  ok++;
};

// Référence : samedi 15 août 2026, 10h00 heure de Paris (UTC+2)
const NOW = '2026-08-15T08:00:00Z';

cas("aujourd'hui", '2026-08-15T06:00:00Z', NOW, 'ce matin');
cas("aujourd'hui", '2026-08-14T22:30:00Z', NOW, "hier 00h30 Paris = aujourd'hui calendaire");
cas('hier', '2026-08-14T21:00:00Z', NOW, 'hier 23h Paris — CALENDAIRE, pas 24 h');
cas('hier', '2026-08-14T06:00:00Z', NOW, 'hier matin');
cas('jeudi dernier', '2026-08-13T10:00:00Z', NOW, 'il y a 2 jours');
cas('dimanche dernier', '2026-08-09T10:00:00Z', NOW, 'il y a 6 jours — dernier cas nommé');
cas('la semaine dernière', '2026-08-08T10:00:00Z', NOW, 'il y a 7 jours');
cas('la semaine dernière', '2026-08-01T10:00:00Z', NOW, 'il y a 14 jours — dernier cas daté');
cas(null, '2026-07-31T10:00:00Z', NOW, 'il y a 15 jours → RIEN');
cas(null, '2026-06-01T10:00:00Z', NOW, 'il y a 2 mois → RIEN, le mot reste');

// Le piège du fuseau : 22h30 UTC le 14 = 00h30 Paris le 15 → aujourd'hui.
// Si le calcul se faisait en UTC, ce serait « hier ». C'est le cas qui
// distingue le calendaire-Paris du calendaire-UTC.
cas("aujourd'hui", '2026-08-14T22:30:00Z', '2026-08-15T20:00:00Z', 'minuit franchi à Paris seulement');

// Nettoyage
assert.strictEqual(nettoyerMot('  Cette semaine on tient la route !  '), 'Cette semaine on tient la route !');
assert.strictEqual(nettoyerMot('<b>gras</b>'), 'bgras/b', 'Chevrons retirés');
assert.strictEqual(nettoyerMot('x'.repeat(250)).length, 200, 'Tronqué à 200');
assert.strictEqual(nettoyerMot(null), '');
assert.strictEqual(nettoyerMot('   '), '', 'Vide après trim = vide (→ retirer, pas insérer)');
ok += 5;

console.log(`✓ ${ok} vérifications passent.`);
console.log("  dont le piège : 00h30 à Paris = « aujourd'hui », pas « hier ».");
