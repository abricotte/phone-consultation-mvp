// Le mot d'Elena — la date floue « qui ne vieillit jamais ».
//
// « aujourd'hui », « hier », « mardi dernier », « la semaine dernière »,
// puis PLUS RIEN : un mot de trois semaines s'affiche sans date. Jamais
// « il y a 22 jours » — ce serait un compteur qui accuse le mot de
// vieillir, alors qu'un mot juste ne vieillit pas.
//
// Différence en jours CALENDAIRES (minuit à minuit, heure de Paris),
// pas en tranches de 24 h : un mot posé hier à 23 h est « hier » à
// 8 h ce matin, pas « aujourd'hui ».

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** 'YYYY-MM-DD' en heure de Paris */
function jourParis(date) {
  return new Date(date).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
}

/** Jours calendaires entre deux dates, en heure de Paris */
function ecartJoursCalendaires(a, b) {
  const [ja, jb] = [jourParis(a), jourParis(b)];
  return Math.round((Date.parse(`${jb}T00:00:00Z`) - Date.parse(`${ja}T00:00:00Z`)) / 86_400_000);
}

/**
 * @param {string|Date} publieLe
 * @param {string|Date} [maintenant] pour les tests
 * @returns {string|null} null au-delà de 14 jours — on n'affiche RIEN
 */
function dateFloue(publieLe, maintenant = new Date()) {
  const jours = ecartJoursCalendaires(publieLe, maintenant);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  if (jours <= 6) {
    const nomJour = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      timeZone: 'Europe/Paris',
    }).format(new Date(publieLe));
    return `${nomJour} dernier`;
  }
  if (jours <= 14) return 'la semaine dernière';
  return null;
}

/** Nettoie un mot saisi : trim, longueur, pas de balise. */
function nettoyerMot(brut) {
  if (typeof brut !== 'string') return '';
  // Le HTML est neutralisé à l'affichage (React échappe), mais on refuse
  // aussi les chevrons à l'entrée : un mot n'a rien à faire avec.
  return brut.replace(/[<>]/g, '').trim().slice(0, 200);
}

module.exports = { dateFloue, nettoyerMot, JOURS };
