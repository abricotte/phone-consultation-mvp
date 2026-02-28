const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/consultants - Liste des consultants disponibles
router.get('/', async (req, res) => {
  try {
    const { specialty, available } = req.query;

    let query = supabase
      .from('consultants')
      .select(`
        id, specialty, description, rate_per_minute, is_available,
        is_verified, rating, total_sessions,
        users ( first_name, last_name )
      `);

    if (available === 'true') {
      query = query.eq('is_available', true);
    }
    if (specialty) {
      query = query.ilike('specialty', `%${specialty}%`);
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) throw error;

    const consultants = data.map((c) => ({
      id: c.id,
      firstName: c.users.first_name,
      lastName: c.users.last_name,
      specialty: c.specialty,
      description: c.description,
      ratePerMinute: c.rate_per_minute,
      isAvailable: c.is_available,
      isVerified: c.is_verified,
      rating: c.rating,
      totalSessions: c.total_sessions,
    }));

    res.json(consultants);
  } catch (err) {
    console.error('Erreur liste consultants:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/consultants/:id - Détail d'un consultant
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select(`
        id, specialty, description, rate_per_minute, is_available,
        is_verified, rating, total_sessions,
        users ( first_name, last_name )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Consultant non trouvé' });
    }

    res.json({
      id: data.id,
      firstName: data.users.first_name,
      lastName: data.users.last_name,
      specialty: data.specialty,
      description: data.description,
      ratePerMinute: data.rate_per_minute,
      isAvailable: data.is_available,
      isVerified: data.is_verified,
      rating: data.rating,
      totalSessions: data.total_sessions,
    });
  } catch (err) {
    console.error('Erreur détail consultant:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/consultants/me - Mettre à jour son profil consultant
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'consultant') {
      return res.status(403).json({ error: 'Accès réservé aux consultants' });
    }

    const { specialty, description, ratePerMinute, isAvailable } = req.body;
    const updates = {};

    if (specialty !== undefined) updates.specialty = specialty;
    if (description !== undefined) updates.description = description;
    if (ratePerMinute !== undefined) updates.rate_per_minute = ratePerMinute;
    if (isAvailable !== undefined) updates.is_available = isAvailable;

    const { data, error } = await supabase
      .from('consultants')
      .update(updates)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: data.id,
      specialty: data.specialty,
      description: data.description,
      ratePerMinute: data.rate_per_minute,
      isAvailable: data.is_available,
    });
  } catch (err) {
    console.error('Erreur mise à jour consultant:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
