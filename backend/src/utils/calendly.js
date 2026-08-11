// Webhook Calendly — vérification de signature et lecture des événements.
//
// Cette porte est ouverte sur l'internet public : n'importe qui peut lui
// envoyer ce qu'il veut. Sans vérification, un inconnu pourrait inscrire
// de faux rendez-vous dans la journée d'Elena, créer des fiches clientes,
// ou faire disparaître de vrais rendez-vous en simulant des annulations.

const crypto = require('crypto');
const { normaliser, chiffresSeuls } = require('./telephone');

// Calendly signe avec un en-tête de la forme :
//   Calendly-Webhook-Signature: t=1633089600,v1=<hmac hexadécimal>
// La charge signée est `${t}.${corps brut}`.
const TOLERANCE_SECONDES = 5 * 60;

/**
 * @param {string} corpsBrut  le corps EXACT reçu, avant tout parsing —
 *   un JSON re-sérialisé ne redonne pas les mêmes octets, donc pas la
 *   même signature.
 * @param {string} entete     valeur de Calendly-Webhook-Signature
 * @param {string} cle        clé de signature (variable d'environnement)
 * @param {number} [maintenant] horodatage en secondes, pour les tests
 * @returns {{valide: boolean, raison?: string}}
 */
function verifierSignature(corpsBrut, entete, cle, maintenant) {
  if (!cle) return { valide: false, raison: 'cle_absente' };
  if (typeof entete !== 'string' || !entete) {
    return { valide: false, raison: 'entete_absent' };
  }

  const parties = Object.fromEntries(
    entete
      .split(',')
      .map((p) => p.trim().split('='))
      .filter((p) => p.length === 2)
  );

  const t = parties.t;
  const v1 = parties.v1;
  if (!t || !v1) return { valide: false, raison: 'entete_malforme' };

  // Fenêtre temporelle : sans elle, une requête légitime interceptée
  // pourrait être rejouée indéfiniment.
  const horodatage = Number(t);
  const now = maintenant ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(horodatage)) {
    return { valide: false, raison: 'horodatage_invalide' };
  }
  if (Math.abs(now - horodatage) > TOLERANCE_SECONDES) {
    return { valide: false, raison: 'horodatage_expire' };
  }

  const attendu = crypto
    .createHmac('sha256', cle)
    .update(`${t}.${corpsBrut}`)
    .digest('hex');

  // Comparaison à temps constant : une comparaison ordinaire s'arrête au
  // premier octet différent, ce qui laisse deviner la signature octet par
  // octet en mesurant le temps de réponse.
  const a = Buffer.from(attendu, 'utf8');
  const b = Buffer.from(v1, 'utf8');
  if (a.length !== b.length) return { valide: false, raison: 'signature_invalide' };
  if (!crypto.timingSafeEqual(a, b)) {
    return { valide: false, raison: 'signature_invalide' };
  }

  return { valide: true };
}

/**
 * Extrait d'un payload Calendly ce dont le cabinet a besoin.
 * Tolérant : Calendly fait évoluer ses payloads, un champ manquant ne
 * doit pas faire perdre un rendez-vous.
 *
 * @returns {object|null} null si le payload est inexploitable
 */
function lireEvenement(corps) {
  const evenement = corps?.event;
  const p = corps?.payload;
  if (!evenement || !p) return null;

  const uri = p.event?.uri || p.scheduled_event?.uri || p.uri;
  if (!uri) return null;

  const se = p.scheduled_event || p.event || {};

  // Le numéro peut arriver dans le champ dédié ou dans une réponse au
  // questionnaire — Calendly place selon la configuration du formulaire.
  const brut =
    p.text_reminder_number ||
    (p.questions_and_answers || []).find((qa) =>
      /t[ée]l[ée]phone|phone|portable|mobile|num[ée]ro/i.test(qa?.question || '')
    )?.answer ||
    null;

  const telephone = normaliser(brut);

  const debut = se.start_time || null;
  const fin = se.end_time || null;
  const minutes =
    debut && fin
      ? Math.max(1, Math.round((new Date(fin) - new Date(debut)) / 60000))
      : null;

  // Le paiement n'est présent que si la collecte est activée sur le type
  // d'événement. On ne retient que les paiements aboutis.
  const paiement = p.payment && p.payment.successful !== false ? p.payment : null;

  return {
    evenement, // 'invitee.created' | 'invitee.canceled'
    calendly_event_uri: uri,
    calendly_invitee_uri: p.uri || null,
    nom: typeof p.name === 'string' ? p.name.trim().slice(0, 120) || null : null,
    email:
      typeof p.email === 'string' ? p.email.trim().toLowerCase().slice(0, 200) || null : null,
    telephone,
    chiffres: telephone ? chiffresSeuls(telephone) : null,
    formule:
      typeof se.name === 'string' ? se.name.trim().slice(0, 200) || null : null,
    debut,
    fin,
    minutes,
    montant_paye: paiement ? Number(paiement.amount) || null : null,
    // Calendly n'horodate pas le paiement séparément : il a lieu à la
    // réservation, donc c'est la date de création de l'invitation qui fait foi.
    paye_le: paiement ? p.created_at || null : null,
  };
}

/**
 * Rapproche la formule Calendly d'un forfait configuré, pour que le
 * rendez-vous parle le même langage que le reste du cabinet.
 * Compare d'abord la durée (fiable), puis le libellé.
 */
function trouverForfait(formule, minutes, forfaits) {
  if (!Array.isArray(forfaits) || forfaits.length === 0) return null;

  if (minutes) {
    const parDuree = forfaits.find((f) => Number(f.minutes) === Number(minutes));
    if (parDuree) return parDuree.code;
  }
  if (typeof formule === 'string' && formule.trim()) {
    const bas = formule.toLowerCase();
    const parNom = forfaits.find(
      (f) =>
        bas.includes(String(f.nom || '').toLowerCase()) ||
        bas.includes(String(f.code || '').toLowerCase())
    );
    if (parNom) return parNom.code;
  }
  return null;
}

module.exports = { verifierSignature, lireEvenement, trouverForfait, TOLERANCE_SECONDES };
