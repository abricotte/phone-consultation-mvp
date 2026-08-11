// Numéros bloqués — l'appelant irrespectueux, celui de 2 h du matin, le
// harceleur. Outil construit à froid : le jour où il sert, on le veut
// immédiatement.
//
// La comparaison porte sur les CHIFFRES SEULS, jamais sur la chaîne
// formatée. Sans cela, le même numéro bloqué en +33612345678 passerait au
// travers composé en 0612345678 ou 0033612345678 — et le blocage ne
// vaudrait rien face à quelqu'un de déterminé.

const supabase = require('../config/supabase');
const { chiffresSeuls, normaliser } = require('./telephone');

/**
 * @param {string|null} telephone numéro sous n'importe quel format
 * @returns {Promise<{bloque: boolean, motif?: string}>}
 */
async function estBloque(telephone) {
  if (!supabase || !telephone) return { bloque: false };

  const chiffres = chiffresSeuls(telephone);
  if (!chiffres) return { bloque: false };

  const { data, error } = await supabase
    .from('numeros_bloques')
    .select('motif')
    .eq('chiffres', chiffres)
    .maybeSingle();

  // En cas d'erreur base, on NE bloque PAS : une panne de lecture ne doit
  // jamais empêcher une cliente légitime de consulter.
  if (error) {
    console.error('Vérification blocage impossible :', error.message);
    return { bloque: false };
  }

  return data ? { bloque: true, motif: data.motif || null } : { bloque: false };
}

/**
 * Prépare les champs d'insertion. Renvoie null si le numéro est invalide.
 */
function preparerBlocage(telephone, motif) {
  const normalise = normaliser(telephone);
  const chiffres = chiffresSeuls(telephone);
  if (!normalise || !chiffres) return null;

  return {
    telephone: normalise,
    chiffres,
    motif: typeof motif === 'string' ? motif.trim().slice(0, 500) || null : null,
  };
}

module.exports = { estBloque, preparerBlocage };
