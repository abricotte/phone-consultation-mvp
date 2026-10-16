// LES EMBLÈMES — la figure que la cliente choisit pour l'accompagner dans
// son espace, à la place d'une photo (Elena, 14 octobre ; migration 019).
// Neuf figures, ensemble, sans colonnes féminin / masculin ; les mots sont
// ceux d'Elena. Même liste que EMBLEMES dans backend/src/routes/profil.js.
//
// Dessins au trait provisoires d'OpenMoji (CC BY-SA 4.0, à créditer dans
// les mentions légales), en attendant qu'Elena peigne les siens.
// « renarde » : le fichier du Loup (dessiné avec le renard de la bibliothèque).

export type Embleme = { cle: string; nom: string; mot: string; fond: string };

export const EMBLEMES: Embleme[] = [
  { cle: "licorne", nom: "La Licorne", mot: "Animal mythologique très sacré, porteur de pureté.", fond: "#F1EDF8" },
  { cle: "colombe", nom: "La Colombe", mot: "Grande spiritualité, protectrice, énergie divine.", fond: "#F8EDF2" },
  { cle: "papillon", nom: "Le Papillon", mot: "L'alchimiste du monde animal, celui qui transforme le plomb en or.", fond: "#FBEFEB" },
  { cle: "cerf", nom: "Le Cerf", mot: "Noblesse et sagesse de la forêt, dignité et force de caractère.", fond: "#FBF3E2" },
  { cle: "cygne", nom: "Le Cygne", mot: "La grâce, la loyauté majestueuse et la fidélité noble.", fond: "#EDF4EC" },
  { cle: "renarde", nom: "Le Loup", mot: "La protection, l'intelligence silencieuse et instinctive, très mystique.", fond: "#EBF2F7" },
  { cle: "sphinx", nom: "Le Sphinx", mot: "Connaissance sacrée, sagesse mystique et le porteur de savoirs anciens.", fond: "#F1EDF8" },
  { cle: "dauphin", nom: "Le Dauphin", mot: "L'ambassadeur des océans, grande télépathie et intuition forte, voyance décuplée.", fond: "#EBF2F7" },
  { cle: "aigle", nom: "L'Aigle", mot: "Agilité et vision claire, celui qui regarde avec du recul, la beauté silencieuse noble.", fond: "#FBF3E2" },
];

export function emblemeParCle(cle: string | null | undefined): Embleme | null {
  return EMBLEMES.find((e) => e.cle === cle) ?? null;
}

// Le dernier emblème connu, gardé dans le navigateur pour que le menu
// l'affiche tout de suite (la base fait foi, Mon profil le resynchronise).
const CLE_LOCALE = "embleme";
export function emblemeLocal(): string | null {
  try { return localStorage.getItem(CLE_LOCALE); } catch { return null; }
}
export function memoriserEmbleme(cle: string | null) {
  try {
    if (cle) localStorage.setItem(CLE_LOCALE, cle);
    else localStorage.removeItem(CLE_LOCALE);
    window.dispatchEvent(new Event("embleme"));
  } catch { /* navigation privée : le menu attendra le prochain chargement */ }
}
