// Webhook Calendly — la porte est ouverte sur l'internet public.
//
// Sans vérification, un inconnu pourrait inscrire de faux rendez-vous
// dans la journée d'Elena, créer des fiches clientes, ou faire
// disparaître de vrais rendez-vous en simulant des annulations.
//
//   node src/utils/calendly.test.js

const assert = require('assert');
const crypto = require('crypto');
const { verifierSignature, lireEvenement, trouverForfait } = require('./calendly');

const CLE = 'cle-de-signature-de-test';
let ok = 0;

function signer(corps, cle = CLE, t = Math.floor(Date.now() / 1000)) {
  const v1 = crypto.createHmac('sha256', cle).update(`${t}.${corps}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

// ── Signature ──────────────────────────────────────────────────────────
const CORPS = JSON.stringify({ event: 'invitee.created', payload: { uri: 'x' } });

assert.strictEqual(verifierSignature(CORPS, signer(CORPS), CLE).valide, true);
ok++;

// Une clé différente ne doit jamais passer
assert.strictEqual(
  verifierSignature(CORPS, signer(CORPS, 'mauvaise-cle'), CLE).valide,
  false,
  'Une signature calculée avec une autre clé est acceptée !'
);
ok++;

// Corps modifié après signature (attaque par altération)
assert.strictEqual(
  verifierSignature(CORPS.replace('invitee.created', 'invitee.canceled'), signer(CORPS), CLE)
    .valide,
  false,
  'Un corps altéré passe la vérification !'
);
ok++;

// Rejeu : une requête légitime mais vieille de 10 minutes
const vieux = Math.floor(Date.now() / 1000) - 600;
assert.strictEqual(
  verifierSignature(CORPS, signer(CORPS, CLE, vieux), CLE).raison,
  'horodatage_expire'
);
ok++;

// Absences et malformations — aucune ne doit lever d'exception
for (const [entete, attendu] of [
  [undefined, 'entete_absent'],
  ['', 'entete_absent'],
  ['nimportequoi', 'entete_malforme'],
  ['t=abc,v1=deadbeef', 'horodatage_invalide'],
  [`t=${Math.floor(Date.now() / 1000)},v1=court`, 'signature_invalide'],
]) {
  const r = verifierSignature(CORPS, entete, CLE);
  assert.strictEqual(r.valide, false);
  assert.strictEqual(r.raison, attendu, `Attendu ${attendu}, obtenu ${r.raison}`);
  ok += 2;
}

// Clé absente côté serveur : on refuse, on ne laisse pas passer
assert.strictEqual(verifierSignature(CORPS, signer(CORPS), '').raison, 'cle_absente');
assert.strictEqual(verifierSignature(CORPS, signer(CORPS), undefined).raison, 'cle_absente');
ok += 2;

// ── Lecture d'un payload de réservation ────────────────────────────────
const RESERVATION = {
  event: 'invitee.created',
  payload: {
    uri: 'https://api.calendly.com/scheduled_events/EVT/invitees/INV',
    name: '  Claire Dupont  ',
    email: '  Claire.Dupont@Example.COM ',
    created_at: '2026-08-11T09:00:00.000000Z',
    text_reminder_number: '06 12 34 56 78',
    scheduled_event: {
      uri: 'https://api.calendly.com/scheduled_events/EVT',
      name: 'Consultation Complète',
      start_time: '2026-08-12T14:00:00.000000Z',
      end_time: '2026-08-12T14:45:00.000000Z',
    },
    payment: { amount: 129, currency: 'EUR', successful: true },
  },
};

const lu = lireEvenement(RESERVATION);
assert.strictEqual(lu.evenement, 'invitee.created');
assert.strictEqual(lu.calendly_event_uri, 'https://api.calendly.com/scheduled_events/EVT');
assert.strictEqual(lu.nom, 'Claire Dupont', 'Le nom doit être nettoyé');
assert.strictEqual(lu.email, 'claire.dupont@example.com', "L'email doit être normalisé");
assert.strictEqual(lu.telephone, '+33612345678', 'Le numéro doit être normalisé');
assert.strictEqual(lu.chiffres, '33612345678');
assert.strictEqual(lu.minutes, 45, 'La durée se déduit du début et de la fin');
assert.strictEqual(lu.montant_paye, 129);
assert.strictEqual(lu.paye_le, '2026-08-11T09:00:00.000000Z');
ok += 9;

// Le numéro peut arriver par le questionnaire plutôt que par le champ dédié
const parQuestionnaire = lireEvenement({
  ...RESERVATION,
  payload: {
    ...RESERVATION.payload,
    text_reminder_number: null,
    questions_and_answers: [
      { question: 'Votre prénom ?', answer: 'Claire' },
      { question: 'Votre numéro de téléphone', answer: '0033612345678' },
    ],
  },
});
assert.strictEqual(parQuestionnaire.telephone, '+33612345678');
assert.strictEqual(
  parQuestionnaire.chiffres,
  lu.chiffres,
  'Les deux chemins doivent donner la même clé de rattachement'
);
ok += 2;

// Un paiement échoué ne doit pas compter comme encaissé
const echoue = lireEvenement({
  ...RESERVATION,
  payload: { ...RESERVATION.payload, payment: { amount: 129, successful: false } },
});
assert.strictEqual(echoue.montant_paye, null, 'Un paiement échoué ne doit rien encaisser');
assert.strictEqual(echoue.paye_le, null);
ok += 2;

// Sans paiement du tout (réservation non payante)
const sansPaiement = lireEvenement({
  ...RESERVATION,
  payload: { ...RESERVATION.payload, payment: null },
});
assert.strictEqual(sansPaiement.montant_paye, null);
ok++;

// Payloads inexploitables — aucun ne doit lever d'exception
for (const mauvais of [null, undefined, {}, { event: 'x' }, { payload: {} }, { event: 'x', payload: {} }]) {
  assert.strictEqual(lireEvenement(mauvais), null, `Aurait dû être ignoré : ${JSON.stringify(mauvais)}`);
  ok++;
}

// Une cliente sans numéro reste enregistrable — elle sera rattachée à la main
const sansTel = lireEvenement({
  ...RESERVATION,
  payload: { ...RESERVATION.payload, text_reminder_number: null },
});
assert.strictEqual(sansTel.telephone, null);
assert.strictEqual(sansTel.chiffres, null);
assert.strictEqual(sansTel.calendly_event_uri, lu.calendly_event_uri, 'Le rendez-vous existe quand même');
ok += 3;

// ── Formulaire Calendly : numéro, naissance, question ──────────────────
//
// Elena rédige ses intitulés comme elle veut : l'extraction ne doit pas
// dépendre d'une formulation exacte.

const AVEC_FORMULAIRE = lireEvenement({
  ...RESERVATION,
  payload: {
    ...RESERVATION.payload,
    text_reminder_number: null,
    questions_and_answers: [
      { question: 'Votre numéro de téléphone', answer: '06 12 34 56 78' },
      { question: 'Votre date de naissance', answer: '12/03/1985' },
      {
        question: 'Que souhaitez-vous aborder ?',
        answer: 'Ma relation avec Marc, et un choix professionnel.',
      },
    ],
  },
});

assert.strictEqual(AVEC_FORMULAIRE.telephone, '+33612345678');
assert.strictEqual(AVEC_FORMULAIRE.date_naissance, '1985-03-12', 'Jour d\'abord, usage français');
assert.strictEqual(
  AVEC_FORMULAIRE.a_aborder,
  'Ma relation avec Marc, et un choix professionnel.',
  'La question doit être isolée du numéro et de la date'
);
ok += 3;

// Intitulés imprévus : le numéro est reconnu à sa FORME, la question est
// ce qui reste une fois numéro et date écartés.
const INTITULES_LIBRES = lireEvenement({
  ...RESERVATION,
  payload: {
    ...RESERVATION.payload,
    text_reminder_number: null,
    questions_and_answers: [
      { question: 'Comment vous joindre ?', answer: '0033612345678' },
      { question: 'Née le', answer: '1985-03-12' },
      { question: 'Un mot pour moi', answer: 'Je tourne en rond depuis des mois.' },
    ],
  },
});
assert.strictEqual(INTITULES_LIBRES.telephone, '+33612345678', 'Numéro reconnu à sa forme');
assert.strictEqual(INTITULES_LIBRES.date_naissance, '1985-03-12');
assert.strictEqual(INTITULES_LIBRES.a_aborder, 'Je tourne en rond depuis des mois.');
ok += 3;

// Plusieurs questions libres : tout est conservé, dans l'ordre
const PLUSIEURS = lireEvenement({
  ...RESERVATION,
  payload: {
    ...RESERVATION.payload,
    questions_and_answers: [
      { question: 'Votre situation', answer: 'Séparation récente.' },
      { question: 'Votre question', answer: 'Va-t-il revenir ?' },
    ],
  },
});
assert.strictEqual(PLUSIEURS.a_aborder, 'Séparation récente.\n\nVa-t-il revenir ?');
ok++;

// Dates aberrantes : mieux vaut aucune date qu'une fausse — elle
// fausserait le signe astrologique affiché à Elena.
for (const mauvaise of ['31/02/1985', '12/13/1985', '12/03/1850', '12/03/2099', 'demain', '']) {
  const r = lireEvenement({
    ...RESERVATION,
    payload: {
      ...RESERVATION.payload,
      questions_and_answers: [{ question: 'Date de naissance', answer: mauvaise }],
    },
  });
  assert.strictEqual(r.date_naissance, null, `Aurait dû être rejetée : ${mauvaise}`);
  ok++;
}

// Un formulaire vide ne doit rien inventer
const SANS_FORMULAIRE = lireEvenement({
  ...RESERVATION,
  payload: { ...RESERVATION.payload, questions_and_answers: [] },
});
assert.strictEqual(SANS_FORMULAIRE.date_naissance, null);
assert.strictEqual(SANS_FORMULAIRE.a_aborder, null);
assert.strictEqual(SANS_FORMULAIRE.telephone, '+33612345678', 'Le champ dédié reste prioritaire');
ok += 3;

// ── Rapprochement avec les forfaits configurés ─────────────────────────
const FORFAITS = [
  { code: 'decouverte', nom: 'Découverte', minutes: 20, prix: 58 },
  { code: 'complete', nom: 'Complète', minutes: 45, prix: 129 },
];

assert.strictEqual(trouverForfait('Peu importe', 45, FORFAITS), 'complete', 'La durée prime');
assert.strictEqual(trouverForfait('Consultation Découverte', null, FORFAITS), 'decouverte');
assert.strictEqual(trouverForfait('Autre chose', 33, FORFAITS), null, 'Aucune correspondance forcée');
assert.strictEqual(trouverForfait('Découverte', 20, []), null);
assert.strictEqual(trouverForfait(null, null, FORFAITS), null);
ok += 5;

console.log(`✓ ${ok} vérifications passent.`);
console.log('  dont : clé fausse, corps altéré, rejeu à 10 min — tous refusés.');
