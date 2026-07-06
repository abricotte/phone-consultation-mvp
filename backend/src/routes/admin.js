const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { getPraticienne, getStatutEnLigne, clearCache } = require('../config/praticienne');

const router = express.Router();

// Réservé à la praticienne (rôle consultant) et aux admins
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'consultant') {
    return res.status(403).json({ error: 'Accès réservé' });
  }
  next();
}

router.use(authMiddleware, adminOnly);

// GET /api/admin/statut - Statut en ligne actuel (auto-off appliqué)
router.get('/statut', async (req, res) => {
  try {
    const statut = await getStatutEnLigne();
    const p = await getPraticienne();
    res.json({
      enLigne: statut.enLigne,
      enLigneDepuis: statut.enLigneDepuis,
      autoOffHeures: p.auto_off_heures || 4,
    });
  } catch (err) {
    console.error('Erreur statut admin:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/statut - Toggle en ligne / hors ligne
router.patch('/statut', async (req, res) => {
  try {
    const { enLigne } = req.body;
    if (typeof enLigne !== 'boolean') {
      return res.status(400).json({ error: 'enLigne (booléen) requis' });
    }

    const p = await getPraticienne();

    const { error } = await supabase
      .from('praticiennes')
      .update({
        statut_en_ligne: enLigne,
        en_ligne_depuis: enLigne ? new Date().toISOString() : null,
      })
      .eq('id', p.id);

    if (error) throw error;

    clearCache();
    console.log(`Statut praticienne : ${enLigne ? 'EN LIGNE' : 'hors ligne'}`);

    res.json({ enLigne, enLigneDepuis: enLigne ? new Date().toISOString() : null });
  } catch (err) {
    console.error('Erreur toggle statut:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/jour - Vue du jour : appels, durées, revenus, soldes
router.get('/jour', async (req, res) => {
  try {
    const p = await getPraticienne();
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, status, duration_seconds, total_cost, created_at')
      .eq('praticienne_id', p.id)
      .gte('created_at', debutJour.toISOString());

    if (sessionsError) throw sessionsError;

    const terminees = sessions.filter((s) => s.status === 'completed');
    const dureeTotaleSecondes = terminees.reduce(
      (acc, s) => acc + (s.duration_seconds || 0), 0
    );
    const revenus = terminees.reduce(
      (acc, s) => acc + parseFloat(s.total_cost || 0), 0
    );

    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('praticienne_id', p.id);

    if (walletsError) throw walletsError;

    const soldesClients = wallets.reduce(
      (acc, w) => acc + parseFloat(w.balance || 0), 0
    );

    res.json({
      appelsDuJour: sessions.length,
      appelsTermines: terminees.length,
      appelsActifs: sessions.filter((s) => s.status === 'active').length,
      dureeTotaleMinutes: Math.round(dureeTotaleSecondes / 60),
      revenusJour: Math.round(revenus * 100) / 100,
      soldesClientsTotal: Math.round(soldesClients * 100) / 100,
      nombreWallets: wallets.length,
    });
  } catch (err) {
    console.error('Erreur vue du jour:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
