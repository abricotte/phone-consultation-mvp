// Tests de la normalisation des numéros — le socle dont dépend
// l'identification des clientes à l'appel entrant.
// Exécution : node src/utils/telephone.test.js

const {
  normaliser,
  memeNumero,
  estMobileFrancais,
  formaterFr,
  masquer,
} = require('./telephone');

let echecs = 0;
function verifier(libelle, obtenu, attendu) {
  const ok = obtenu === attendu;
  if (!ok) echecs++;
  console.log(
    `${ok ? 'OK  ' : 'ÉCHEC'} ${libelle.padEnd(38)} → ${JSON.stringify(obtenu)}` +
      (ok ? '' : `  (attendu ${JSON.stringify(attendu)})`)
  );
}

const CIBLE = '+33612345678';

console.log('\n=== Les trois formats exigés ===');
verifier('+33612345678', normaliser('+33612345678'), CIBLE);
verifier('0612345678', normaliser('0612345678'), CIBLE);
verifier('0033612345678', normaliser('0033612345678'), CIBLE);

console.log('\n=== Écritures courantes ===');
verifier('06 12 34 56 78', normaliser('06 12 34 56 78'), CIBLE);
verifier('06.12.34.56.78', normaliser('06.12.34.56.78'), CIBLE);
verifier('06-12-34-56-78', normaliser('06-12-34-56-78'), CIBLE);
verifier('(06) 12 34 56 78', normaliser('(06) 12 34 56 78'), CIBLE);
verifier('+33 6 12 34 56 78', normaliser('+33 6 12 34 56 78'), CIBLE);
verifier('33612345678', normaliser('33612345678'), CIBLE);
verifier('+33 06 12 34 56 78 (zéro en trop)', normaliser('+33 06 12 34 56 78'), CIBLE);
verifier('espace insécable', normaliser('06 12 34 56 78'), CIBLE);

console.log('\n=== Entrées à rejeter ===');
verifier('vide', normaliser(''), null);
verifier('null', normaliser(null), null);
verifier('lettres', normaliser('abcdefghij'), null);
verifier('trop court', normaliser('0612'), null);
verifier('trop long', normaliser('06123456789012345'), null);

console.log('\n=== Comparaison : le cœur du sujet ===');
verifier('+33… == 06…', memeNumero('+33612345678', '0612345678'), true);
verifier('0033… == 06…', memeNumero('0033612345678', '06 12 34 56 78'), true);
verifier('33… == +33…', memeNumero('33612345678', '+33612345678'), true);
verifier('deux numéros différents', memeNumero('0612345678', '0698765432'), false);
verifier('comparaison avec du vide', memeNumero('0612345678', ''), false);

console.log('\n=== Nature du numéro ===');
verifier('06 est un mobile', estMobileFrancais('0612345678'), true);
verifier('07 est un mobile', estMobileFrancais('0712345678'), true);
verifier('01 n’est pas un mobile', estMobileFrancais('0162290799'), false);

console.log('\n=== Affichage ===');
verifier('formaterFr', formaterFr('+33612345678'), '06 12 34 56 78');
verifier('masquer', masquer('+33612345678'), '+336****5678');

console.log(
  echecs === 0
    ? '\n✓ Tous les tests passent.\n'
    : `\n✕ ${echecs} test(s) en échec.\n`
);
process.exit(echecs === 0 ? 0 : 1);
