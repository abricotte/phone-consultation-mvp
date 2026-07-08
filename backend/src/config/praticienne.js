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
      max_minutes: 90,
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
      maxMinutes: r.max_minutes ?? 90,
    },
  };
}

function clearCache() {
  cache = null;
  cacheAt = 0;
}

// Machine à états : hors_ligne | disponible | en_consultation
// Lecture du statut avec AUTO-OFF paresseux : si la praticienne est
// "disponible" depuis plus de auto_off_heures, elle repasse hors ligne
// en base au moment de la lecture (pas besoin de cron).
async function getStatutEnLigne() {
  const horsLigne = { statut: 'hors_ligne', enLigne: false, enLigneDepuis: null, retourPrevu: null };
  if (!supabase) return horsLigne;

  const { data, error } = await supabase
    .from('praticiennes')
    .select('id, statut, statut_precedent, en_ligne_depuis, auto_off_heures, retour_prevu, updated_at')
    .eq('slug', SLUG)
    .single();

  if (error || !data) return horsLigne;

  if (data.statut === 'disponible' && data.en_ligne_depuis) {
    const limiteMs = (data.auto_off_heures || 4) * 3600 * 1000;
    if (Date.now() - new Date(data.en_ligne_depuis).getTime() > limiteMs) {
      await supabase
        .from('praticiennes')
        .update({
          statut: 'hors_ligne',
          statut_en_ligne: false, // legacy, synchronisé
          en_ligne_depuis: null,
          retour_prevu: null,
        })
        .eq('id', data.id)
        .eq('statut', 'disponible'); // ne jamais écraser une consultation en cours
      clearCache();
      console.log(`Auto-off : praticienne ${SLUG} repassée hors ligne (limite ${data.auto_off_heures}h)`);
      return { ...horsLigne, autoOff: true };
    }
  }

  // GARDE-FOU verrou orphelin : si "en_consultation" alors qu'aucun appel
  // n'existe réellement (échec de lancement dont la libération a été
  // court-circuitée par une erreur réseau, crash du process, etc.), le
  // verrou est libéré automatiquement à la lecture suivante du statut.
  if (data.statut === 'en_consultation') {
    const verrouAgeMs = Date.now() - new Date(data.updated_at).getTime();
    // Cas 1 : la fin prévue est dépassée depuis plus de 3 min (la fin
    // normale passe par finalizeSession — si elle n'est jamais venue,
    // le verrou est périmé).
    const finDepassee =
      data.retour_prevu &&
      Date.now() > new Date(data.retour_prevu).getTime() + 3 * 60 * 1000;

    // Cas 2 : verrou posé depuis plus de 90 s mais AUCUNE session
    // réellement VIVANTE. Une session ne "protège" le verrou que si :
    //   - elle est connectée pour de vrai (started_at posé), OU
    //   - elle vient d'être lancée (créée il y a moins de 90 s).
    // Une session restée "active" sans started_at et vieille = morte
    // (l'appel a échoué au stade TwiML, ex. signature rejetée, et les
    // callbacks de nettoyage n'ont jamais pu aboutir). Ce cas couvre
    // aussi bien le flux minutée (sans timeout) que l'immédiat.
    let orphelin = false;
    if (!finDepassee && verrouAgeMs > 90_000) {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, started_at, created_at')
        .eq('praticienne_id', data.id)
        .in('status', ['pending', 'active']);

      const maintenant = Date.now();
      const uneVivante = (sessions || []).some(
        (s) =>
          s.started_at ||
          maintenant - new Date(s.created_at).getTime() < 90_000
      );
      orphelin = !uneVivante;
    }

    if (finDepassee || orphelin) {
      const retour = data.statut_precedent === 'disponible' ? 'disponible' : 'hors_ligne';
      await supabase
        .from('praticiennes')
        .update({
          statut: retour,
          statut_en_ligne: retour === 'disponible',
          retour_prevu: null,
        })
        .eq('id', data.id)
        .eq('statut', 'en_consultation');

      // Clôturer aussi les sessions mortes (active/pending sans started_at)
      // pour ne pas laisser de traînée qui re-protégerait un futur verrou.
      await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('praticienne_id', data.id)
        .in('status', ['pending', 'active'])
        .is('started_at', null);

      clearCache();
      console.warn(
        `Garde-fou : verrou en_consultation orphelin libéré (${finDepassee ? 'fin prévue dépassée' : 'aucune session vivante'}) → "${retour}"`
      );
      return {
        statut: retour,
        enLigne: retour === 'disponible',
        enLigneDepuis: data.en_ligne_depuis,
        retourPrevu: null,
      };
    }
  }

  return {
    statut: data.statut,
    enLigne: data.statut === 'disponible', // compat indicateur existant
    enLigneDepuis: data.en_ligne_depuis,
    retourPrevu: data.retour_prevu,
  };
}

// VERROU ATOMIQUE : disponible → en_consultation.
// UPDATE conditionnel (WHERE statut = 'disponible') : si 0 ligne
// affectée, quelqu'un d'autre vient de prendre la ligne → refus propre.
async function verrouillerConsultation(dureeMaxSecondes) {
  if (!supabase) return { ok: false };

  const retourPrevu = new Date(Date.now() + dureeMaxSecondes * 1000).toISOString();

  const { data, error } = await supabase
    .from('praticiennes')
    .update({
      statut: 'en_consultation',
      statut_precedent: 'disponible',
      statut_en_ligne: false, // legacy : plus joignable pendant l'appel
      retour_prevu: retourPrevu,
    })
    .eq('slug', SLUG)
    .eq('statut', 'disponible')
    .select('id');

  clearCache();
  if (error || !data || data.length === 0) return { ok: false };
  return { ok: true, retourPrevu };
}

// Libération : en_consultation → statut antérieur du toggle.
// Conditionnel (WHERE statut = 'en_consultation') : sans effet si
// l'état a déjà changé (idempotent, appelable depuis tout callback).
// NE LÈVE JAMAIS d'exception : une erreur ici ne doit jamais
// court-circuiter le reste d'un chemin d'échec appelant. En dernier
// recours, le garde-fou de getStatutEnLigne rattrape un verrou orphelin.
async function libererConsultation() {
  try {
    if (!supabase) return;

    const { data } = await supabase
      .from('praticiennes')
      .select('id, statut, statut_precedent')
      .eq('slug', SLUG)
      .single();

    if (!data || data.statut !== 'en_consultation') return;

    const retour = data.statut_precedent || 'disponible';
    await supabase
      .from('praticiennes')
      .update({
        statut: retour,
        statut_en_ligne: retour === 'disponible', // legacy, synchronisé
        retour_prevu: null,
      })
      .eq('id', data.id)
      .eq('statut', 'en_consultation');

    clearCache();
    console.log(`Praticienne libérée : retour au statut "${retour}"`);
  } catch (err) {
    console.error(`Libération du verrou échouée (le garde-fou rattrapera) : ${err.message}`);
  }
}

module.exports = {
  getPraticienne,
  getTarifs,
  getStatutEnLigne,
  verrouillerConsultation,
  libererConsultation,
  clearCache,
};
