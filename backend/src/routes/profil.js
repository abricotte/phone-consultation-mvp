const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Liens autorisés pour "les personnes qui comptent" (doit correspondre au
// CHECK de la migration 002 et au <select> du frontend).
const LIENS = ['compagnon', 'ex', 'mere', 'pere', 'enfant', 'ami', 'autre'];

// Ascendants autorisés (CHECK de la migration 003). Saisi par la cliente
// si elle le connaît — jamais calculé (il faudrait l'heure et le lieu).
const ASCENDANTS = [
  'belier', 'taureau', 'gemeaux', 'cancer', 'lion', 'vierge',
  'balance', 'scorpion', 'sagittaire', 'capricorne', 'verseau', 'poissons',
];

// Valide un ascendant FACULTATIF. Retourne { value } ou { error }.
function validerAscendant(input) {
  if (input === null || input === undefined || input === '') {
    return { value: null };
  }
  if (typeof input !== 'string' || !ASCENDANTS.includes(input)) {
    return { error: 'Ascendant invalide.' };
  }
  return { value: input };
}

// Valide une date de naissance FACULTATIVE au format 'YYYY-MM-DD'.
// Retourne { value } (string ou null) si OK, ou { error } sinon.
function validerDateNaissance(input) {
  if (input === null || input === undefined || input === '') {
    return { value: null };
  }
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return { error: 'Date de naissance invalide (format attendu : AAAA-MM-JJ).' };
  }
  const d = new Date(input + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) {
    return { error: 'Date de naissance invalide.' };
  }
  const annee = d.getUTCFullYear();
  const maintenant = new Date();
  if (d > maintenant) {
    return { error: 'La date de naissance ne peut pas être dans le futur.' };
  }
  if (annee < 1900) {
    return { error: 'Date de naissance invalide.' };
  }
  return { value: input };
}

function serialiserProche(p) {
  return {
    id: p.id,
    prenom: p.prenom,
    dateNaissance: p.date_naissance,
    ascendant: p.ascendant || null,
    lien: p.lien,
  };
}

// GET /api/profil - Profil de la cliente connectée (date + proches)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [{ data: user, error: userError }, { data: proches, error: prochesError }] =
      await Promise.all([
        supabase
          .from('users')
          .select('first_name, date_naissance, ascendant, a_aborder, a_aborder_maj_le')
          .eq('id', req.user.id)
          .single(),
        supabase
          .from('proches')
          .select('id, prenom, date_naissance, ascendant, lien')
          .eq('client_id', req.user.id)
          .order('created_at', { ascending: true }),
      ]);

    if (userError) throw userError;
    if (prochesError) throw prochesError;

    res.json({
      prenom: user?.first_name || null,
      dateNaissance: user?.date_naissance || null,
      ascendant: user?.ascendant || null,
      // Écrit par la cliente POUR Elena — l'inverse du carnet privé.
      aAborder: user?.a_aborder || '',
      aAborderMajLe: user?.a_aborder_maj_le || null,
      proches: (proches || []).map(serialiserProche),
    });
  } catch (err) {
    console.error('Erreur lecture profil:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/profil - Mise à jour PARTIELLE : seuls les champs présents
// dans le body sont modifiés (dateNaissance et/ou ascendant, facultatifs).
router.patch('/', authMiddleware, async (req, res) => {
  try {
    const maj = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'dateNaissance')) {
      const { value, error: dateError } = validerDateNaissance(req.body.dateNaissance);
      if (dateError) {
        return res.status(400).json({ error: dateError });
      }
      maj.date_naissance = value;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'ascendant')) {
      const { value, error: ascError } = validerAscendant(req.body.ascendant);
      if (ascError) {
        return res.status(400).json({ error: ascError });
      }
      maj.ascendant = value;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'aAborder')) {
      const brut = req.body.aAborder;
      if (typeof brut !== 'string') {
        return res.status(400).json({ error: 'Texte invalide.' });
      }
      // 2000 caractères : de quoi préparer une consultation sans en faire
      // un journal. Le vider est un geste légitime (« c'est réglé »), on
      // range alors null plutôt qu'une chaîne vide.
      const texte = brut.trim().slice(0, 2000);
      maj.a_aborder = texte || null;
      maj.a_aborder_maj_le = texte ? new Date().toISOString() : null;
    }

    if (Object.keys(maj).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
    }

    const { error } = await supabase
      .from('users')
      .update(maj)
      .eq('id', req.user.id);

    if (error) throw error;

    res.json({
      dateNaissance: 'date_naissance' in maj ? maj.date_naissance : undefined,
      ascendant: 'ascendant' in maj ? maj.ascendant : undefined,
      aAborder: 'a_aborder' in maj ? maj.a_aborder || '' : undefined,
      aAborderMajLe: 'a_aborder_maj_le' in maj ? maj.a_aborder_maj_le : undefined,
      message: 'Profil mis à jour.',
    });
  } catch (err) {
    console.error('Erreur mise à jour profil:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/profil/proches - Ajouter une personne qui compte
router.post('/proches', authMiddleware, async (req, res) => {
  try {
    const prenom = typeof req.body.prenom === 'string' ? req.body.prenom.trim() : '';
    const lien = req.body.lien;

    if (!prenom) {
      return res.status(400).json({ error: 'Le prénom est requis.' });
    }
    if (prenom.length > 100) {
      return res.status(400).json({ error: 'Prénom trop long (100 caractères maximum).' });
    }
    if (!LIENS.includes(lien)) {
      return res.status(400).json({ error: 'Lien invalide.' });
    }

    const { value, error: dateError } = validerDateNaissance(req.body.dateNaissance);
    if (dateError) {
      return res.status(400).json({ error: dateError });
    }

    const { value: ascendant, error: ascError } = validerAscendant(req.body.ascendant);
    if (ascError) {
      return res.status(400).json({ error: ascError });
    }

    const { data: proche, error } = await supabase
      .from('proches')
      .insert({
        client_id: req.user.id,
        prenom,
        date_naissance: value,
        ascendant,
        lien,
      })
      .select('id, prenom, date_naissance, ascendant, lien')
      .single();

    if (error) throw error;

    res.status(201).json(serialiserProche(proche));
  } catch (err) {
    console.error('Erreur ajout proche:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/profil/proches/:id - Supprimer une personne qui compte
// Scopé au client_id : on ne peut jamais supprimer le proche d'une autre.
router.delete('/proches/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('proches')
      .delete()
      .eq('id', req.params.id)
      .eq('client_id', req.user.id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Proche non trouvé.' });
    }

    res.json({ message: 'Proche supprimé.' });
  } catch (err) {
    console.error('Erreur suppression proche:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
