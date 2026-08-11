// Réglages de pilotage de la praticienne (taux fiscaux, seuils).
//
// Ils vivaient dans le localStorage du navigateur. Conséquence observée :
// le défaut URSSAF est passé à 26 % dans le code, mais un navigateur qui
// avait mémorisé l'ancien 23 % continuait de l'afficher — le « net estimé »
// était optimiste de 3 points sans que rien ne le signale. Ils sont donc
// désormais en base, dans praticiennes.config_tarifs.reglages.
//
// Miroir de frontend/lib/reglages.ts : mêmes bornes, mêmes défauts. Le
// serveur reste l'autorité — le navigateur ne fait que proposer.

const DEFAUT = {
  tvaActive: true,
  tvaTaux: 20,
  urssaf: 26, // 25,6 % de cotisations + CFP
  impot: 10, // provision volontairement un peu au-dessus du théorique
  coutsFixes: 0,
  seuilTwilio: 5,
  seuilHabituee: 5,
};

// [min, max] par champ numérique. Un réglage aberrant fausserait tous les
// calculs de revenus, donc rien ne passe sans être borné.
const BORNES = {
  tvaTaux: [0, 30],
  urssaf: [0, 60],
  impot: [0, 60],
  coutsFixes: [0, 100000],
  seuilTwilio: [0, 1000],
  seuilHabituee: [1, 100],
};

function borner(brut) {
  const r = brut && typeof brut === 'object' ? brut : {};
  const sortie = { tvaActive: r.tvaActive !== false };

  for (const [cle, [min, max]] of Object.entries(BORNES)) {
    const n = Number(r[cle]);
    sortie[cle] = Number.isFinite(n)
      ? Math.min(max, Math.max(min, n))
      : DEFAUT[cle];
  }
  // Les seuils se comptent en unités entières
  sortie.seuilHabituee = Math.round(sortie.seuilHabituee);
  return sortie;
}

module.exports = { REGLAGES_DEFAUT: DEFAUT, borner };
