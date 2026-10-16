import { SIGNES_LISTE } from "@/lib/astro";

// LES NŒUDS LUNAIRES — les deux points où l'orbite de la Lune croise la
// route du Soleil. En astrologie karmique : le Nœud Sud, ce que l'âme
// connaît déjà, d'où elle vient ; le Nœud Nord, ce qu'elle est venue
// apprendre, où elle va. Ils sont toujours opposés (180°).
//
// Nœud moyen (le plus utilisé), zodiaque tropical, formule de Meeus
// (Astronomical Algorithms, ch. 47). Il recule d'environ 3' par jour : la
// date de naissance suffit, l'heure ne change rien au signe (sauf à
// quelques heures d'un changement de signe, tous les dix-huit mois).

export type Noeud = { longitude: number; signe: { code: string; nom: string; emoji: string }; degre: number };
export type Noeuds = { nord: Noeud; sud: Noeud };

function noeud(lon: number): Noeud {
  const l = ((lon % 360) + 360) % 360;
  const i = Math.floor(l / 30);
  return { longitude: l, signe: SIGNES_LISTE[i], degre: Math.floor(l - i * 30) };
}

export function noeudsLunaires(dateNaissance: string | null | undefined): Noeuds | null {
  if (!dateNaissance || !/^\d{4}-\d{2}-\d{2}/.test(dateNaissance)) return null;
  const [a, m, j] = dateNaissance.slice(0, 10).split("-").map(Number);
  const jd = Date.UTC(a, m - 1, j, 12) / 86400000 + 2440587.5; // midi UTC
  const t = (jd - 2451545.0) / 36525;
  const omega = 125.0445479 - 1934.1362891 * t + 0.0020754 * t * t + (t * t * t) / 467441 - (t * t * t * t) / 60616000;
  return { nord: noeud(omega), sud: noeud(omega + 180) };
}
