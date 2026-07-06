const supabase = require('./supabase');

const SLUG = process.env.PRATICIENNE_SLUG || 'elena-wolska';
const CACHE_MS = 60_000;

// Fallback TRANSITOIRE : utilisé uniquement tant que la table
// praticiennes n'est pas migrée (ou si la base est injoignable).
// La source de vérité est la base — ne pas éditer les tarifs ici.
const DEFAUTS = {
  nom_public: 'Elena Wolska',
  slug: SLUG,
  statut_en_ligne: false,
  config_tarifs: {
    devise: 'EUR',
    prix_minute: 2.9,
    credit_minimum_minutes: 5,
    bip_avant_fin_secondes: 120,
    arrondi: 'minute_superieure',
    forfaits: [
      { code: 'decouverte', nom: 'Consultation Découverte', minutes: 20, prix: 58 },
      { code: 'complete', nom: 'Consultation Complète', minutes: 45, prix: 129 },
    ],
    recharge: {
      suggestions_minutes: [10, 20, 30],
      defaut_minutes: 20,
      pas_minutes: 5,
      min_minutes: 5,
      max_minutes: 60,
    },
  },
};

let cache = null;
let cacheAt = 0;

// Praticienne active (mono-praticienne aujourd'hui : Elena).
// En multi-praticiennes, ce module résoudra par domaine/slug de la requête.
async function getPraticienne() {
  if (cache && Date.now() - cacheAt < CACHE_MS) return cache;

  try {
    if (!supabase) throw new Error('Supabase non configuré');

    const { data, error } = await supabase
      .from('praticiennes')
      .select('*')
      .eq('slug', SLUG)
      .single();

    if (error || !data) throw error || new Error('praticienne introuvable');

    cache = data;
    cacheAt = Date.now();
    return data;
  } catch (err) {
    console.warn(`Config praticienne : fallback par défaut (${err.message})`);
    return DEFAUTS;
  }
}

// Tarifs normalisés, montants en CENTIMES entiers (jamais de float)
async function getTarifs() {
  const p = await getPraticienne();
  const t = p.config_tarifs || {};
  const r = t.recharge || {};

  return {
    nomPublic: p.nom_public,
    prixMinuteCents: Math.round((t.prix_minute ?? 2.9) * 100),
    creditMinimumMinutes: t.credit_minimum_minutes ?? 5,
    bipAvantFinSecondes: t.bip_avant_fin_secondes ?? 120,
    forfaits: t.forfaits ?? [],
    recharge: {
      suggestionsMinutes: r.suggestions_minutes ?? [10, 20, 30],
      defautMinutes: r.defaut_minutes ?? 20,
      pasMinutes: r.pas_minutes ?? 5,
      minMinutes: r.min_minutes ?? 5,
      maxMinutes: r.max_minutes ?? 60,
    },
  };
}

function clearCache() {
  cache = null;
  cacheAt = 0;
}

// Statut en ligne avec AUTO-OFF paresseux : si la praticienne est en
// ligne depuis plus de auto_off_heures, on la repasse hors ligne en
// base au moment de la lecture (pas besoin de cron).
async function getStatutEnLigne() {
  if (!supabase) return { enLigne: false, enLigneDepuis: null };

  const { data, error } = await supabase
    .from('praticiennes')
    .select('id, statut_en_ligne, en_ligne_depuis, auto_off_heures')
    .eq('slug', SLUG)
    .single();

  if (error || !data) return { enLigne: false, enLigneDepuis: null };

  if (data.statut_en_ligne && data.en_ligne_depuis) {
    const limiteMs = (data.auto_off_heures || 4) * 3600 * 1000;
    if (Date.now() - new Date(data.en_ligne_depuis).getTime() > limiteMs) {
      await supabase
        .from('praticiennes')
        .update({ statut_en_ligne: false, en_ligne_depuis: null })
        .eq('id', data.id);
      clearCache();
      console.log(`Auto-off : praticienne ${SLUG} repassée hors ligne (limite ${data.auto_off_heures}h)`);
      return { enLigne: false, enLigneDepuis: null, autoOff: true };
    }
  }

  return {
    enLigne: data.statut_en_ligne,
    enLigneDepuis: data.en_ligne_depuis,
  };
}

module.exports = { getPraticienne, getTarifs, getStatutEnLigne, clearCache };
