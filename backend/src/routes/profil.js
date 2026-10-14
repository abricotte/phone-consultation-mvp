const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { dateFloue } = require('../utils/motElena');

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

// GET /api/profil/rendez-vous - Le prochain rendez-vous Calendly de la
// cliente. Elle réservait sur Calendly et ne voyait rien dans son espace :
// la tuile « Prochain rendez-vous » de l'accueil lit ceci. Les liens pour
// déplacer ou annuler viennent de la charge utile Calendly (jamais
// réécrits à la main).
router.get('/rendez-vous', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rendez_vous')
      .select('id, debut, fin, formule, minutes, statut, montant_paye, charge_utile')
      .eq('client_id', req.user.id)
      .eq('statut', 'prevu')
      .gte('fin', new Date().toISOString())
      .order('debut', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.json({ prochain: null });

    const payload = data.charge_utile?.payload || data.charge_utile || {};
    const lien = (u) => (typeof u === 'string' && /^https:\/\/calendly\.com\//.test(u) ? u : null);
    res.json({
      prochain: {
        id: data.id,
        debut: data.debut,
        fin: data.fin,
        formule: data.formule || null,
        minutes: data.minutes || null,
        regle: data.montant_paye !== null && data.montant_paye !== undefined,
        rescheduleUrl: lien(payload.reschedule_url),
        cancelUrl: lien(payload.cancel_url),
      },
    });
  } catch (err) {
    console.error('Erreur prochain rendez-vous:', err);
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

// GET /api/profil/mot-elena - Le mot du jour d'Elena, pour toute cliente
// connectée. Un seul mot actif ; s'il n'y en a pas, l'espace affiche la
// citation du jour — le frontend n'a qu'à tester `mot === null`.
router.get('/mot-elena', authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase
      .from('mot_elena')
      .select('texte, publie_le')
      .eq('retire', false)
      .order('publie_le', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return res.json({ mot: null });

    res.json({
      mot: {
        texte: data.texte,
        // La date floue est calculée ICI, en heure de Paris : le
        // navigateur d'une cliente peut être sur n'importe quel fuseau.
        quand: dateFloue(data.publie_le),
      },
    });
  } catch {
    // Table absente ou erreur : la citation reprend, jamais d'écran cassé.
    res.json({ mot: null });
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

// ── Les tests spirituels : les résultats gardés (migration 014) ──
// On garde le profil et la date, jamais les réponses. Chaque passage
// est une ligne ; la cliente peut en effacer une.
const TEST_SLUG = /^[a-z0-9-]{1,60}$/;

// GET /api/profil/tests — mes résultats, les plus récents d'abord
router.get('/tests', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resultats_tests')
      .select('id, test, profil, titre_profil, score, cree_le')
      .eq('client_id', req.user.id)
      .order('cree_le', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({
      resultats: (data || []).map((r) => ({
        id: r.id, test: r.test, profil: r.profil, titreProfil: r.titre_profil, score: r.score, creeLe: r.cree_le,
      })),
    });
  } catch (err) {
    console.error('Erreur résultats tests:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/profil/tests — enregistrer un résultat { test, profil, titreProfil, score? }
router.post('/tests', authMiddleware, async (req, res) => {
  try {
    const { test, profil, titreProfil, score } = req.body || {};
    if (typeof test !== 'string' || !TEST_SLUG.test(test)) return res.status(400).json({ error: 'Test invalide.' });
    if (typeof profil !== 'string' || profil.length < 1 || profil.length > 60) return res.status(400).json({ error: 'Profil invalide.' });
    if (typeof titreProfil !== 'string' || titreProfil.length < 1 || titreProfil.length > 120) return res.status(400).json({ error: 'Profil invalide.' });
    const scoreOk = score === null || score === undefined ? null : Number.isInteger(score) ? score : NaN;
    if (Number.isNaN(scoreOk)) return res.status(400).json({ error: 'Score invalide.' });

    const { data, error } = await supabase
      .from('resultats_tests')
      .insert({ client_id: req.user.id, test, profil, titre_profil: titreProfil, score: scoreOk })
      .select('id, test, profil, titre_profil, score, cree_le')
      .single();
    if (error) throw error;
    res.status(201).json({
      resultat: { id: data.id, test: data.test, profil: data.profil, titreProfil: data.titre_profil, score: data.score, creeLe: data.cree_le },
    });
  } catch (err) {
    console.error('Erreur enregistrement test:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/profil/tests/:id — effacer un de mes résultats
router.delete('/tests/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('resultats_tests')
      .delete()
      .eq('id', req.params.id)
      .eq('client_id', req.user.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    console.error('Erreur effacement test:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Les commandes de tirages (migration 015) ──
// La cliente dépose sa commande et sa question ; Elena la voit au cabinet.
// Les prix sont ceux de la page Mes tirages (Elena, 12-14 octobre).
const TIRAGES = { pythie: 55, grand_tableau: 149 };

// GET /api/profil/commandes — mes commandes, les plus récentes d'abord
router.get('/commandes', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commandes_tirages')
      .select('id, type, question, statut, montant, paye, cree_le, livre_le')
      .eq('client_id', req.user.id)
      .order('cree_le', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({
      commandes: (data || []).map((c) => ({
        id: c.id, type: c.type, question: c.question, statut: c.statut, montant: parseFloat(c.montant), paye: c.paye, creeLe: c.cree_le, livreLe: c.livre_le,
      })),
    });
  } catch (err) {
    console.error('Erreur commandes:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/profil/commandes — { type: 'pythie' | 'grand_tableau', question? }
router.post('/commandes', authMiddleware, async (req, res) => {
  try {
    const { type, question } = req.body || {};
    if (!Object.prototype.hasOwnProperty.call(TIRAGES, type)) return res.status(400).json({ error: 'Tirage invalide.' });
    const q = typeof question === 'string' ? question.trim().slice(0, 2000) : '';
    if (type === 'pythie' && !q) return res.status(400).json({ error: 'Écrivez votre question pour la Petite Pythie.' });
    const { data, error } = await supabase
      .from('commandes_tirages')
      .insert({ client_id: req.user.id, type, question: q || null, montant: TIRAGES[type] })
      .select('id, type, question, statut, montant, paye, cree_le, livre_le')
      .single();
    if (error) throw error;
    res.status(201).json({
      commande: { id: data.id, type: data.type, question: data.question, statut: data.statut, montant: parseFloat(data.montant), paye: data.paye, creeLe: data.cree_le, livreLe: data.livre_le },
    });
  } catch (err) {
    console.error('Erreur commande:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ── La boîte à idées du salon (migration 016) ──
// Sous les boosts, la cliente souffle un thème à Elena. Elena le lit au cabinet.

// GET /api/profil/suggestions — mes idées, les plus récentes d'abord
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suggestions_clientes')
      .select('id, sujet, texte, cree_le')
      .eq('client_id', req.user.id)
      .order('cree_le', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json({ suggestions: (data || []).map((s) => ({ id: s.id, sujet: s.sujet, texte: s.texte, creeLe: s.cree_le })) });
  } catch (err) {
    console.error('Erreur suggestions:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/profil/suggestions — { texte, sujet? }
router.post('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { texte, sujet } = req.body || {};
    const t = typeof texte === 'string' ? texte.trim().slice(0, 600) : '';
    if (!t) return res.status(400).json({ error: 'Écrivez votre idée.' });
    const s = sujet === undefined ? 'boost' : sujet;
    if (s !== 'boost') return res.status(400).json({ error: 'Sujet invalide.' });
    const { data, error } = await supabase
      .from('suggestions_clientes')
      .insert({ client_id: req.user.id, sujet: s, texte: t })
      .select('id, sujet, texte, cree_le')
      .single();
    if (error) throw error;
    res.status(201).json({ suggestion: { id: data.id, sujet: data.sujet, texte: data.texte, creeLe: data.cree_le } });
  } catch (err) {
    console.error('Erreur suggestion:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
