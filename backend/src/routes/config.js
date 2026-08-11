const express = require('express');
const supabase = require('../config/supabase');
const { getTarifs, getStatutEnLigne, getPraticienne } = require('../config/praticienne');

const router = express.Router();

// Garde-fou mémoire contre un envoi en boucle : au plus N signaux par
// minute, toutes visiteuses confondues. Volontairement SANS mémoriser
// d'adresse IP — un compteur global suffit à protéger la statistique.
let fenetreDebut = Date.now();
let signauxFenetre = 0;
const MAX_SIGNAUX_PAR_MINUTE = 300;

// POST /api/config/visite — compteur de fréquentation ANONYME.
//
// Route PUBLIQUE et volontairement NON authentifiée : aucun jeton n'est
// lu, donc aucune identité ne peut être associée à la visite, même par
// accident. Le client envoie seulement « j'ai du crédit ou non » et la
// page. Le serveur incrémente un compteur par créneau horaire.
//
// La déduplication est faite par le NAVIGATEUR (il ne renvoie pas de
// signal pour un créneau déjà compté) : le serveur ne sait jamais qui
// revient, ni combien de personnes distinctes se cachent derrière un
// compteur. C'est le prix, assumé, d'une statistique réellement anonyme.
router.post('/visite', async (req, res) => {
  // Réponse immédiate : une statistique ne doit jamais ralentir la page
  res.status(204).end();

  try {
    const maintenant = Date.now();
    if (maintenant - fenetreDebut > 60_000) {
      fenetreDebut = maintenant;
      signauxFenetre = 0;
    }
    if (++signauxFenetre > MAX_SIGNAUX_PAR_MINUTE) return;

    const page = req.body?.page === 'consultation-minute' ? 'consultation-minute' : 'accueil';
    const avecCredit = req.body?.avecCredit === true;

    const p = await getPraticienne();
    const d = new Date();

    await supabase.rpc('incrementer_visite', {
      p_praticienne: p.id,
      p_jour: d.toISOString().slice(0, 10),
      p_heure: d.getHours(),
      p_jour_semaine: d.getDay(),
      p_avec_credit: avecCredit,
      p_page: page,
    });
  } catch (err) {
    // Une statistique qui échoue ne doit rien casser
    console.error('Compteur de visite:', err.message);
  }
});

// GET /api/config/statut - Statut public (indicateur temps réel, 3 états)
//
// retourPrevu : « Elena est en consultation — de retour vers 15 h ».
// La différence entre une porte close et une porte qui dit quand elle
// rouvre — c'est cette information qui déclenche le bon appel au bon
// moment. Donnée non sensible : c'est l'heure de fin maximale de la
// consultation en cours, jamais rien sur la cliente concernée.
//
// heuresIndicatives : « Je suis généralement en ligne en soirée » —
// texte réglé par la praticienne dans son profil, affiché quand elle
// est hors ligne pour éviter les appels espérés à 8 h du matin.
router.get('/statut', async (req, res) => {
  try {
    const { statut, enLigne, retourPrevu } = await getStatutEnLigne();

    let heuresIndicatives = null;
    let messageAbsence = null;
    try {
      const p = await getPraticienne();
      const b = p.config_branding || {};
      heuresIndicatives = b.heures_indicatives || null;

      // ABSENCE PROGRAMMÉE — le message ne s'affiche QUE dans sa fenêtre.
      // Calculé à chaque lecture plutôt que posé par une tâche de fond :
      // rien à déclencher, rien à oublier de retirer au retour. Une date
      // seule vaut aussi : début sans fin = « à partir du », fin sans
      // début = « jusqu'au ».
      const aujourdhui = new Date().toLocaleDateString('sv-SE', {
        timeZone: 'Europe/Paris',
      });
      const commence = !b.absence_debut || b.absence_debut <= aujourdhui;
      const pasFini = !b.absence_fin || b.absence_fin >= aujourdhui;
      if (b.message_absence && commence && pasFini) {
        messageAbsence = b.message_absence;
      }
    } catch {
      /* le statut doit répondre même si la fiche praticienne échoue */
    }

    res.json({
      statut,
      enLigne, // conservé pour compatibilité
      retourPrevu: statut === 'en_consultation' ? retourPrevu : null,
      heuresIndicatives,
      messageAbsence,
    });
  } catch (err) {
    console.error('Erreur statut public:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/config/recharge - Paramètres publics du sélecteur de recharge
// (aucune donnée sensible : uniquement tarifs et bornes affichés au client)
router.get('/recharge', async (req, res) => {
  try {
    const tarifs = await getTarifs();
    res.json({
      prixMinuteCents: tarifs.prixMinuteCents,
      creditMinimumMinutes: tarifs.creditMinimumMinutes,
      ...tarifs.recharge,
    });
  } catch (err) {
    console.error('Erreur config recharge:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
