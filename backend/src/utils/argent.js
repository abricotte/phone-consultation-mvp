// L'ARGENT EN CENTIMES ENTIERS — jamais de calcul flottant sur un montant
// (0,1 + 0,2 ne fait pas 0,3 en JavaScript). On convertit en centimes à
// l'entrée, on calcule en entiers, on rend une chaîne « 8.70 » pour la base
// (colonnes DECIMAL : PostgreSQL garde la valeur exacte).

/** « 2.90 », 2.9, "14,50" → 290 / 1450. NaN si illisible. */
function centimes(montant) {
  if (montant === null || montant === undefined || montant === '') return NaN;
  const n = Number(String(montant).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

/** 870 → "8.70" (pour la base et Stripe) */
function versEuros(cents) {
  return (cents / 100).toFixed(2);
}

/** Nombre de minutes entières qu'un solde permet, au tarif donné. */
function minutesPermises(solde, tarif) {
  const s = centimes(solde);
  const t = centimes(tarif);
  if (!Number.isFinite(s) || !Number.isFinite(t) || t <= 0 || s <= 0) return 0;
  return Math.floor(s / t);
}

module.exports = { centimes, versEuros, minutesPermises };
