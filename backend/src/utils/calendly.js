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
 * Tolerant : Calendly fait evoluer ses payloads, et les intitules du
 * formulaire sont ecrits par Elena — un champ manquant ne doit jamais
 * faire perdre un rendez-vous.
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
  const questions = Array.isArray(p.questions_and_answers)
    ? p.questions_and_answers
    : [];

  // TELEPHONE — champ dedie de Calendly d'abord, sinon une question du
  // formulaire. En dernier recours, une reponse qui RESSEMBLE a un
  // numero : Elena redige ses questions comme elle veut, et un libelle
  // imprevu ne doit pas la priver du moyen de rappeler sa cliente.
  const telephone =
    normaliser(p.text_reminder_number) ||
    normaliser(reponseA(questions, /t[eé]l[eé]phone|phone|portable|mobile|num[eé]ro/i)) ||
    normaliser(questions.map((qa) => qa?.answer).find(ressembleAUnNumero)) ||
    null;

  // DATE DE NAISSANCE — saisie a la main, donc dans n'importe quel format.
  const dateNaissance = lireDateNaissance(
    reponseA(questions, /naissance|birth|n[eé]\(?e?\)? le/i)
  );

  // CE QU'ELLE VEUT ABORDER — sa question, lue avant de decrocher.
  // On prend tout ce qui n'est ni un numero, ni une date, ni un prenom :
  // plutot que de deviner l'intitule exact, on garde ce qui reste, qui
  // est par construction ce qu'elle a voulu dire.
  const aAborder = questions
    .filter((qa) => {
      const q = qa?.question || '';
      const r = (qa?.answer || '').trim();
      if (!r) return false;
      if (/t[eé]l[eé]phone|phone|portable|mobile|num[eé]ro/i.test(q)) return false;
      if (/naissance|birth|n[eé]\(?e?\)? le/i.test(q)) return false;
      if (/pr[eé]nom|nom|first ?name|last ?name|e-?mail/i.test(q)) return false;
      if (ressembleAUnNumero(r)) return false;
      return true;
    })
    .map((qa) => (qa.answer || '').trim())
    .join('\n\n')
    .slice(0, 2000);

  const debut = se.start_time || null;
  const fin = se.end_time || null;
  const minutes =
    debut && fin
      ? Math.max(1, Math.round((new Date(fin) - new Date(debut)) / 60000))
      : null;

  // Le paiement n'est present que si la collecte est activee sur le type
  // d'evenement. On ne retient que les paiements aboutis.
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
    date_naissance: dateNaissance,
    a_aborder: aAborder || null,
    formule:
      typeof se.name === 'string' ? se.name.trim().slice(0, 200) || null : null,
    debut,
    fin,
    minutes,
    montant_paye: paiement ? Number(paiement.amount) || null : null,
    // Calendly n'horodate pas le paiement separement : il a lieu a la
    // reservation, donc c'est la date de creation de l'invitation qui fait foi.
    paye_le: paiement ? p.created_at || null : null,
  };
}

/** Reponse a la premiere question dont l'intitule correspond au motif. */
function reponseA(questions, motif) {
  return questions.find((qa) => motif.test(qa?.question || ''))?.answer || null;
}

/** Au moins 9 chiffres et rien d'autre que de la ponctuation telephonique. */
function ressembleAUnNumero(valeur) {
  if (typeof valeur !== 'string') return false;
  const t = valeur.trim();
  if (!/^[+0-9 .()\/-]{9,25}$/.test(t)) return false;
  return t.replace(/\D/g, '').length >= 9;
}

/**
 * Une date saisie a la main arrive sous toutes les formes.
 * @returns {string|null} format ISO `AAAA-MM-JJ`, ou null si illisible
 */
function lireDateNaissance(brut) {
  if (typeof brut !== 'string') return null;
  const t = brut.trim();
  if (!t) return null;

  // 12/03/1985, 12-03-1985, 12.03.1985 → jour d'abord (usage francais)
  const fr = t.match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4})$/);
  if (fr) return valider(fr[3], fr[2], fr[1]);

  // 1985-03-12 : deja au bon format
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return valider(iso[1], iso[2], iso[3]);

  return null;
}

/**
 * Bornes de bon sens : hors de ces limites c'est une faute de frappe, et
 * une fausse date de naissance vaut moins que pas de date du tout — elle
 * fausserait le signe astrologique affiche a Elena.
 */
function valider(a, m, j) {
  const annee = Number(a);
  const mois = Number(m);
  const jour = Number(j);

  if (annee < 1900 || annee > new Date().getFullYear()) return null;
  if (mois < 1 || mois > 12) return null;
  if (jour < 1 || jour > 31) return null;

  const d = new Date(Date.UTC(annee, mois - 1, jour));
  if (d.getUTCMonth() !== mois - 1 || d.getUTCDate() !== jour) return null; // 31 fevrier

  return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

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
