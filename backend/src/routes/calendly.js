// Webhook Calendly — reçoit les réservations et les annulations.
//
// Volume visé : ~5 forfaits par jour. Les retrouver dans une boîte mail
// n'est plus tenable ; ils arrivent désormais directement dans le cabinet.
//
// Monté AVANT express.json() (cf. index.js) : la signature se calcule sur
// le corps BRUT, et un JSON re-sérialisé ne redonne pas les mêmes octets.

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { getTarifs } = require('../config/praticienne');
const { verifierSignature, lireEvenement, trouverForfait } = require('../utils/calendly');
const { chiffresSeuls } = require('../utils/telephone');

const router = express.Router();

// ------------------------------------------------------------------
// Rattachement d'une réservation à une fiche cliente.
//
// Par le NUMÉRO d'abord : c'est lui qui sert à appeler, et il change
// moins souvent qu'une adresse email. Par l'email ensuite.
// ------------------------------------------------------------------
async function trouverCliente({ chiffres, email }) {
  if (chiffres) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'client')
      .filter('phone', 'not.is', null);

    // Comparaison sur les chiffres seuls : la même personne peut être
    // enregistrée en +33… et avoir réservé en 06…
    if (data?.length) {
      const { data: complet } = await supabase
        .from('users')
        .select('id, phone')
        .in('id', data.map((u) => u.id));
      const trouvee = (complet || []).find((u) => chiffresSeuls(u.phone) === chiffres);
      if (trouvee) return trouvee.id;
    }
  }

  if (email) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (data) return data.id;
  }

  return null;
}

/**
 * Crée une fiche pour une personne qui n'a rien demandé : elle doit
 * exister pour son historique et ses notes, mais son compte ne doit pas
 * être connectable tant qu'elle ne s'est pas inscrite elle-même.
 *
 * Le mot de passe est un secret aléatoire que personne ne connaît — y
 * compris nous. Le marqueur `origine` permettra à l'inscription de
 * REPRENDRE cette fiche plutôt que d'en créer une seconde.
 */
async function creerFiche({ nom, email, telephone }) {
  const morceaux = (nom || '').trim().split(/\s+/);
  const prenom = morceaux[0] || 'Cliente';
  const nomFamille = morceaux.slice(1).join(' ') || '—';

  const inutilisable = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email || `calendly+${crypto.randomUUID()}@non-renseigne.invalid`,
      password_hash: inutilisable,
      first_name: prenom,
      last_name: nomFamille,
      phone: telephone || null,
      role: 'client',
      origine: 'calendly',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Création de fiche Calendly impossible :', error.message);
    return null;
  }

  // Portefeuille, comme à l'inscription : sans lui, une recharge
  // ultérieure n'aurait nulle part où atterrir.
  await supabase.from('wallets').insert({ user_id: data.id });

  return data.id;
}

// POST /api/calendly/webhook
router.post(
  '/webhook',
  express.raw({ type: '*/*', limit: '1mb' }),
  async (req, res) => {
    const corpsBrut = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

    const controle = verifierSignature(
      corpsBrut,
      req.get('Calendly-Webhook-Signature'),
      process.env.CALENDLY_WEBHOOK_SIGNING_KEY
    );

    if (!controle.valide) {
      console.warn(`Webhook Calendly refusé : ${controle.raison}`);
      return res.status(403).send('Signature invalide');
    }

    // Accusé de réception immédiat : au-delà de quelques secondes,
    // Calendly considère l'envoi en échec et le réémet. Le traitement
    // se poursuit ensuite — l'unicité de calendly_event_uri rend un
    // éventuel réessai inoffensif.
    res.status(200).send('OK');

    let corps;
    try {
      corps = JSON.parse(corpsBrut);
    } catch {
      console.error('Webhook Calendly : corps illisible');
      return;
    }

    const e = lireEvenement(corps);
    if (!e) {
      console.error('Webhook Calendly : événement inexploitable');
      return;
    }

    try {
      if (e.evenement === 'invitee.canceled') {
        await supabase
          .from('rendez_vous')
          .update({ statut: 'annule', maj_le: new Date().toISOString() })
          .eq('calendly_event_uri', e.calendly_event_uri);
        console.log(`Rendez-vous annulé : ${e.calendly_event_uri}`);
        return;
      }

      if (e.evenement !== 'invitee.created') return;

      let clientId = await trouverCliente(e);
      if (!clientId) {
        clientId = await creerFiche(e);
      }

      const tarifs = await getTarifs().catch(() => null);
      const forfaitCode = trouverForfait(e.formule, e.minutes, tarifs?.forfaits);

      // upsert : si Calendly réémet le même événement, la ligne est mise
      // à jour au lieu d'être dupliquée dans la liste du jour.
      const { error } = await supabase.from('rendez_vous').upsert(
        {
          calendly_event_uri: e.calendly_event_uri,
          calendly_invitee_uri: e.calendly_invitee_uri,
          client_id: clientId,
          telephone: e.telephone,
          chiffres: e.chiffres,
          nom: e.nom,
          email: e.email,
          formule: e.formule,
          forfait_code: forfaitCode,
          minutes: e.minutes,
          debut: e.debut,
          fin: e.fin,
          statut: 'prevu',
          montant_paye: e.montant_paye,
          paye_le: e.paye_le,
          charge_utile: corps,
          maj_le: new Date().toISOString(),
        },
        { onConflict: 'calendly_event_uri' }
      );

      if (error) throw error;
      console.log(
        `Rendez-vous enregistré : ${e.nom || 'inconnue'} le ${e.debut}` +
          (clientId ? '' : ' (non rattaché)')
      );
    } catch (err) {
      console.error('Webhook Calendly : traitement impossible —', err.message);
    }
  }
);

module.exports = router;
