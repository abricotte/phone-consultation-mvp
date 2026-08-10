// SOURCE UNIQUE de la manipulation des numéros de téléphone.
//
// Il existait auparavant trois implémentations divergentes (calls.js,
// admin.js, auth.js) : deux ignoraient le préfixe international « 00 ».
// Une cliente enregistrée « 0033612345678 » n'était donc pas reconnue
// quand son appel arrivait — précisément le genre de panne silencieuse
// qui fait passer une fidèle pour une inconnue.
//
// Tout le code doit passer par ce module. Aucune exception.

/**
 * Ramène un numéro au format international E.164 (+33612345678).
 * Retourne null si l'entrée n'est pas exploitable.
 *
 * Formats acceptés :
 *   06 12 34 56 78 · 06.12.34.56.78 · (06) 12-34-56-78
 *   +33 6 12 34 56 78 · 0033612345678 · 33612345678
 *   +33 06 12 34 56 78  (le zéro superflu est retiré)
 */
function normaliser(entree) {
  if (typeof entree !== 'string') return null;

  // Espaces de toutes sortes (y compris insécables), ponctuation de saisie
  let c = entree.replace(/[\s  \-.()/]/g, '');
  if (!c) return null;

  // Préfixe international écrit « 00 » → « + »
  if (c.startsWith('00')) c = '+' + c.slice(2);

  // Numéro national français : 0X XX XX XX XX
  if (/^0\d{9}$/.test(c)) c = '+33' + c.slice(1);

  // Indicatif sans le plus : 33XXXXXXXXX
  if (/^33\d{9}$/.test(c)) c = '+' + c;

  // « +33 0 6… » : le zéro national est superflu après l'indicatif
  if (/^\+330\d{9}$/.test(c)) c = '+33' + c.slice(4);

  // À ce stade, seul un E.164 plausible est accepté
  return /^\+[1-9]\d{7,14}$/.test(c) ? c : null;
}

/**
 * Chiffres seuls, pour comparer deux numéros écrits différemment.
 * Le « 0 » national est retiré pour que 0612345678 et +33612345678
 * produisent la même clé.
 */
function chiffresSeuls(entree) {
  const n = normaliser(entree);
  return n ? n.replace(/\D/g, '') : null;
}

/** Deux écritures désignent-elles le même numéro ? */
function memeNumero(a, b) {
  const x = chiffresSeuls(a);
  const y = chiffresSeuls(b);
  return x !== null && x === y;
}

/** Mobile français (06 ou 07) au format E.164 */
function estMobileFrancais(entree) {
  const n = normaliser(entree);
  return n !== null && /^\+33[67]\d{8}$/.test(n);
}

/** Numéro français valide, mobile ou fixe */
function estNumeroFrancais(entree) {
  const n = normaliser(entree);
  return n !== null && /^\+33[1-9]\d{8}$/.test(n);
}

/** +33612345678 → 06 12 34 56 78 (lisible, prêt à composer) */
function formaterFr(entree) {
  const n = normaliser(entree);
  if (!n) return typeof entree === 'string' ? entree : '';
  const national = n.startsWith('+33') ? '0' + n.slice(3) : n;
  return /^0\d{9}$/.test(national)
    ? national.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
    : n;
}

/** +33612345678 → +336****5678 (pour les journaux) */
function masquer(entree) {
  const n = normaliser(entree);
  if (!n) return '(inconnu)';
  return `${n.slice(0, 4)}****${n.slice(-4)}`;
}

module.exports = {
  normaliser,
  chiffresSeuls,
  memeNumero,
  estMobileFrancais,
  estNumeroFrancais,
  formaterFr,
  masquer,
};
