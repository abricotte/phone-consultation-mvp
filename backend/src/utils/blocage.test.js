// Un blocage ne vaut que s'il résiste au changement de format.
//
// Le risque réel : un harceleur bloqué en +33612345678 recompose en
// 0612345678 ou 0033612345678 et passe au travers. La comparaison porte
// donc sur les chiffres seuls, jamais sur la chaîne formatée.
//
//   node src/utils/blocage.test.js

const assert = require('assert');
const { preparerBlocage } = require('./blocage');

let ok = 0;

// ── Toutes les écritures d'un même numéro doivent converger ────────────
const FORMES = [
  '+33612345678',
  '0612345678',
  '0033612345678',
  '06 12 34 56 78',
  '06.12.34.56.78',
  '+33 6 12 34 56 78',
  '0033 612 345 678',
];

const references = FORMES.map((f) => preparerBlocage(f, null));
references.forEach((r, i) => {
  assert.ok(r, `Forme refusée à tort : ${FORMES[i]}`);
  ok++;
});

const chiffres = new Set(references.map((r) => r.chiffres));
assert.strictEqual(
  chiffres.size,
  1,
  `Les ${FORMES.length} écritures doivent donner LA MÊME clé, or : ${[...chiffres].join(' / ')}`
);
ok++;

// Le numéro rangé est normalisé, pas la saisie brute
assert.strictEqual(preparerBlocage('06 12 34 56 78', null).telephone, '+33612345678');
ok++;

// ── Numéros invalides ──────────────────────────────────────────────────
for (const mauvais of [null, undefined, '', '   ', 'bonjour', '123', '06123456']) {
  assert.strictEqual(
    preparerBlocage(mauvais, null),
    null,
    `Aurait dû être refusé : ${JSON.stringify(mauvais)}`
  );
  ok++;
}

// ── Motif : facultatif, nettoyé, borné ─────────────────────────────────
assert.strictEqual(preparerBlocage('0612345678', '  appels nocturnes  ').motif, 'appels nocturnes');
assert.strictEqual(preparerBlocage('0612345678', '   ').motif, null, 'Un motif vide devient null');
assert.strictEqual(preparerBlocage('0612345678', null).motif, null);
assert.strictEqual(preparerBlocage('0612345678', 'x'.repeat(900)).motif.length, 500);
ok += 4;

console.log(`✓ ${ok} vérifications passent.`);
console.log(`  ${FORMES.length} écritures du même numéro → 1 seule clé : ${[...chiffres][0]}`);
