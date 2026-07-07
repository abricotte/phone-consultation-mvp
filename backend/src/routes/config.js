const express = require('express');
const { getTarifs, getStatutEnLigne } = require('../config/praticienne');

const router = express.Router();

// GET /api/config/statut - Statut public (indicateur temps réel, 3 états)
router.get('/statut', async (req, res) => {
  try {
    const { statut, enLigne } = await getStatutEnLigne();
    res.json({ statut, enLigne }); // enLigne conservé pour compatibilité
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
