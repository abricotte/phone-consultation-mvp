// Signe astrologique (zodiaque tropical) calculé depuis une date de
// naissance. AFFICHAGE UNIQUEMENT — jamais stocké en base.

export interface Signe {
  nom: string;
  emoji: string;
}

// Les 12 signes dans l'ordre du zodiaque — sert aux sélecteurs
// d'ascendant (slugs alignés sur le CHECK de la migration 003).
export const SIGNES_LISTE: { code: string; nom: string; emoji: string }[] = [
  { code: "belier", nom: "Bélier", emoji: "♈" },
  { code: "taureau", nom: "Taureau", emoji: "♉" },
  { code: "gemeaux", nom: "Gémeaux", emoji: "♊" },
  { code: "cancer", nom: "Cancer", emoji: "♋" },
  { code: "lion", nom: "Lion", emoji: "♌" },
  { code: "vierge", nom: "Vierge", emoji: "♍" },
  { code: "balance", nom: "Balance", emoji: "♎" },
  { code: "scorpion", nom: "Scorpion", emoji: "♏" },
  { code: "sagittaire", nom: "Sagittaire", emoji: "♐" },
  { code: "capricorne", nom: "Capricorne", emoji: "♑" },
  { code: "verseau", nom: "Verseau", emoji: "♒" },
  { code: "poissons", nom: "Poissons", emoji: "♓" },
];

// Résout un slug d'ascendant ('vierge') vers { nom, emoji }, ou null.
export function signeParCode(code: string | null | undefined): Signe | null {
  if (!code) return null;
  const s = SIGNES_LISTE.find((x) => x.code === code);
  return s ? { nom: s.nom, emoji: s.emoji } : null;
}

// Bornes de fin de chaque signe (mois 1-12, jour inclus).
const SIGNES: { finMois: number; finJour: number; signe: Signe }[] = [
  { finMois: 1, finJour: 19, signe: { nom: "Capricorne", emoji: "♑" } },
  { finMois: 2, finJour: 18, signe: { nom: "Verseau", emoji: "♒" } },
  { finMois: 3, finJour: 20, signe: { nom: "Poissons", emoji: "♓" } },
  { finMois: 4, finJour: 19, signe: { nom: "Bélier", emoji: "♈" } },
  { finMois: 5, finJour: 20, signe: { nom: "Taureau", emoji: "♉" } },
  { finMois: 6, finJour: 20, signe: { nom: "Gémeaux", emoji: "♊" } },
  { finMois: 7, finJour: 22, signe: { nom: "Cancer", emoji: "♋" } },
  { finMois: 8, finJour: 22, signe: { nom: "Lion", emoji: "♌" } },
  { finMois: 9, finJour: 22, signe: { nom: "Vierge", emoji: "♍" } },
  { finMois: 10, finJour: 22, signe: { nom: "Balance", emoji: "♎" } },
  { finMois: 11, finJour: 21, signe: { nom: "Scorpion", emoji: "♏" } },
  { finMois: 12, finJour: 21, signe: { nom: "Sagittaire", emoji: "♐" } },
  // Après le 21 décembre → Capricorne (rebouclé en tête de tableau)
];

const CAPRICORNE: Signe = { nom: "Capricorne", emoji: "♑" };

// Accepte une date 'YYYY-MM-DD' (ou tout ce que Date sait parser).
// Retourne null si la date est absente ou invalide.
export function signeAstrologique(dateNaissance: string | null | undefined): Signe | null {
  if (!dateNaissance) return null;

  // On lit mois/jour directement depuis 'YYYY-MM-DD' pour éviter tout
  // décalage de fuseau horaire.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateNaissance);
  if (!match) return null;

  const mois = parseInt(match[2], 10);
  const jour = parseInt(match[3], 10);
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;

  for (const { finMois, finJour, signe } of SIGNES) {
    if (mois === finMois && jour <= finJour) return signe;
    if (mois < finMois) return signe;
  }
  return CAPRICORNE;
}

// "12 mars 1990" à partir de 'YYYY-MM-DD'
export function formatDateNaissance(dateNaissance: string | null | undefined): string {
  if (!dateNaissance) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateNaissance);
  if (!match) return "";
  const d = new Date(
    parseInt(match[1], 10),
    parseInt(match[2], 10) - 1,
    parseInt(match[3], 10)
  );
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
