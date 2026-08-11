// Garde-fous tarifaires — le serveur fait foi.
//
// Une faute de frappe sur un prix ne casse pas un écran : elle facture
// réellement une cliente, ou brade des heures de consultation. Les bornes
// sont donc volontairement étroites plutôt que « techniquement valides ».

const PRIX_MIN = 1; // €/min
const PRIX_MAX = 5; // €/min

// Un forfait qui reviendrait à moins de la moitié du tarif à la minute est
// presque toujours un chiffre mal tapé : 12 € au lieu de 129 € pour 45 min.
const RATIO_FORFAIT_MIN = 0.5;

/** @returns {string|null} message d'erreur, ou null si le prix est acceptable */
function verifierPrixMinute(prix) {
  const n = Number(prix);
  if (!Number.isFinite(n) || n < PRIX_MIN || n > PRIX_MAX) {
    return `Prix à la minute invalide : il doit être compris entre ${PRIX_MIN},00 € et ${PRIX_MAX},00 €.`;
  }
  return null;
}

/**
 * Le prix/minute implicite est le vrai révélateur d'une erreur de saisie.
 * @returns {string|null} message d'erreur, ou null si le forfait est cohérent
 */
function verifierForfait({ nom, minutes, prix }, prixMinute) {
  const m = Number(minutes);
  const p = Number(prix);
  if (!Number.isFinite(m) || !Number.isFinite(p) || m <= 0) return null;

  const parMinute = p / m;
  const plancher = Number(prixMinute) * RATIO_FORFAIT_MIN;

  if (parMinute < plancher) {
    return (
      `Le forfait « ${nom} » revient à ${parMinute.toFixed(2)} €/min, ` +
      `soit moins de la moitié de votre tarif à la minute ` +
      `(${Number(prixMinute).toFixed(2)} €/min). Vérifiez le prix : ` +
      `${p} € pour ${Math.round(m)} min.`
    );
  }
  return null;
}

module.exports = {
  PRIX_MIN,
  PRIX_MAX,
  RATIO_FORFAIT_MIN,
  verifierPrixMinute,
  verifierForfait,
};
