// Les nombres d'une cliente, pour le CABINET SEULEMENT (Elena, 14 octobre
// 2026 : « je ne veux pas qu'elle sache des choses sur la numérologie »).
// Règles portées telles quelles du moteur de son site (engine.ts) :
// tableau moderne 1–9, maîtres nombres 11/22/33 conservés, dettes 13/14/16/19.
// Le mois personnel n'était pas dans le moteur : formule classique
// (année personnelle + mois civil, réduit).

const TABLE: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
};
const VOYELLES = new Set(["a", "e", "i", "o", "u"]);
const MAITRES = [11, 22, 33];

const somme = (n: number) => String(n).split("").reduce((a, b) => a + parseInt(b, 10), 0);
export function reduire(n: number): number {
  while (n > 9 && !MAITRES.includes(n)) n = somme(n);
  return n;
}
function reduireSimple(n: number): number {
  while (n > 9) n = somme(n);
  return n;
}
function normaliser(nom: string): string {
  return nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
}
function yVoyelle(c: string[], i: number): boolean {
  if (c[i] !== "y") return false;
  const p = i > 0 ? c[i - 1] : null, s = i < c.length - 1 ? c[i + 1] : null;
  return (!p || !VOYELLES.has(p)) && (!s || !VOYELLES.has(s));
}

export function cheminDeVie(j: number, m: number, a: number): number {
  return reduire(reduire(m) + reduire(j) + reduire(somme(a)));
}
function cheminDeVieDouble(j: number, m: number, a: number): number {
  return reduireSimple(m) + reduireSimple(j) + reduireSimple(somme(a));
}
export function anneePersonnelle(j: number, m: number, anneeCivile: number): number {
  return reduire(reduireSimple(m) + reduireSimple(j) + reduireSimple(somme(anneeCivile)));
}
export function moisPersonnel(anneePerso: number, moisCivil: number): number {
  return reduire(reduireSimple(anneePerso) + moisCivil);
}
export function expression(nomComplet: string): number {
  const parts = nomComplet.trim().split(/\s+/).filter(Boolean);
  const sommes = parts.map((p) => reduire([...normaliser(p)].reduce((s, ch) => s + (TABLE[ch] || 0), 0)));
  return reduire(sommes.reduce((a, b) => a + b, 0));
}
export function elanDeLAme(nomComplet: string): number {
  const c = [...normaliser(nomComplet)];
  return reduire(c.reduce((s, ch, i) => s + (VOYELLES.has(ch) || yVoyelle(c, i) ? TABLE[ch] : 0), 0));
}
export function personnalite(nomComplet: string): number {
  const c = [...normaliser(nomComplet)];
  return reduire(c.reduce((s, ch, i) => s + (!VOYELLES.has(ch) && !yVoyelle(c, i) ? TABLE[ch] || 0 : 0), 0));
}
export function dettesKarmiques(j: number, m: number, a: number): number[] {
  const k = [13, 14, 16, 19], d: number[] = [];
  if (k.includes(j)) d.push(j);
  const sa = somme(a);
  if (k.includes(sa)) d.push(sa);
  if (sa > 9 && !k.includes(sa)) { const sa2 = somme(sa); if (k.includes(sa2)) d.push(sa2); }
  const lp = cheminDeVieDouble(j, m, a);
  if (k.includes(lp)) d.push(lp);
  if (lp > 19) { const n = somme(lp); if (k.includes(n)) d.push(n); }
  return [...new Set(d)];
}
export function leconsKarmiques(nomComplet: string): number[] {
  const presents = new Set([...normaliser(nomComplet)].map((ch) => TABLE[ch]).filter(Boolean));
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !presents.has(n));
}
export function passionCachee(nomComplet: string): number[] {
  const f: Record<number, number> = {};
  for (const ch of normaliser(nomComplet)) { const n = TABLE[ch]; if (n) f[n] = (f[n] || 0) + 1; }
  let max = 0, out: number[] = [];
  for (const [n, c] of Object.entries(f)) { if (c > max) { max = c; out = [Number(n)]; } else if (c === max) out.push(Number(n)); }
  return out;
}

export type Nombres = {
  cheminDeVie: number;
  anneePersonnelle: number;
  moisPersonnel: number;
  expression: number | null;
  elan: number | null;
  personnalite: number | null;
  dettes: number[];
  lecons: number[];
  passion: number[];
  anneeCivile: number;
  moisCivil: number;
};

/** Tout d'un coup, d'après « AAAA-MM-JJ » et le nom complet (prénom + nom, facultatif). */
export function nombres(dateNaissance: string, nomComplet?: string | null, aujourdHui = new Date()): Nombres | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateNaissance || "");
  if (!m) return null;
  const a = +m[1], mo = +m[2], j = +m[3];
  const anneeCivile = aujourdHui.getFullYear(), moisCivil = aujourdHui.getMonth() + 1;
  const ap = anneePersonnelle(j, mo, anneeCivile);
  const nom = (nomComplet || "").trim();
  const avecNom = normaliser(nom).length > 0;
  return {
    cheminDeVie: cheminDeVie(j, mo, a),
    anneePersonnelle: ap,
    moisPersonnel: moisPersonnel(ap, moisCivil),
    expression: avecNom ? expression(nom) : null,
    elan: avecNom ? elanDeLAme(nom) : null,
    personnalite: avecNom ? personnalite(nom) : null,
    dettes: dettesKarmiques(j, mo, a),
    lecons: avecNom ? leconsKarmiques(nom) : [],
    passion: avecNom ? passionCachee(nom) : [],
    anneeCivile,
    moisCivil,
  };
}

/** Deux mots par nombre, pour la lecture rapide au cabinet (pas de texte client). */
export const MOT_DU_NOMBRE: Record<number, string> = {
  1: "l'élan, l'indépendance",
  2: "le lien, l'écoute",
  3: "l'expression, la joie",
  4: "la construction, la patience",
  5: "la liberté, le changement",
  6: "l'amour, la responsabilité",
  7: "la quête, le retrait",
  8: "le pouvoir, la récolte",
  9: "l'achèvement, le don",
  11: "l'intuition, maître nombre",
  22: "le bâtisseur, maître nombre",
  33: "le guide, maître nombre",
};

/** Une couleur par nombre, pour le cabinet (fond de la tuile, couleur du chiffre). */
export const COULEUR_DU_NOMBRE: Record<number, { fond: string; encre: string }> = {
  1: { fond: "#F9DCD5", encre: "#B23A2A" },
  2: { fond: "#FBE4CF", encre: "#A85A17" },
  3: { fond: "#FBF0C4", encre: "#8A6A0A" },
  4: { fond: "#DFEFD9", encre: "#3C6B35" },
  5: { fond: "#D8E8F6", encre: "#2F5F8F" },
  6: { fond: "#F9D9E5", encre: "#A3245A" },
  7: { fond: "#E6DBF4", encre: "#5B3F8C" },
  8: { fond: "#F3E3C0", encre: "#7A5A12" },
  9: { fond: "#E8E3EF", encre: "#4E4560" },
  11: { fond: "#E3E8EF", encre: "#3F4A5C" },
  22: { fond: "#EBDCCB", encre: "#7A4B21" },
  33: { fond: "#F6DCD8", encre: "#8F3B4B" },
};

/** Les dettes karmiques (13, 14, 16, 19) : une ligne ou deux, pour Elena. */
export const SENS_DETTE: Record<number, string> = {
  13: "Dette de travail : la facilité a été prise ailleurs. Ici, tout se construit pas à pas, avec rigueur, sans raccourci.",
  14: "Dette de liberté : excès, dispersion, abus des sens par le passé. Elle apprend la mesure, la constance, tenir ses engagements.",
  16: "Dette d'ego et d'amour : orgueil, liens brisés. Des chutes soudaines remettent l'ego à sa place et ouvrent à l'humilité, au spirituel.",
  19: "Dette de pouvoir : la force utilisée pour soi seule. Elle apprend à demander de l'aide, à ne pas tout porter seule, à partager.",
};

/** Les leçons karmiques (chiffres absents du nom) : ce qu'elle vient apprendre. */
export const SENS_LECON: Record<number, string> = {
  1: "Apprendre à s'affirmer, à prendre l'initiative, à décider seule.",
  2: "Apprendre la patience, l'écoute, la coopération, la douceur dans le lien.",
  3: "Apprendre à s'exprimer, à montrer ses émotions, à oser la joie.",
  4: "Apprendre la méthode, la constance, l'effort qui dure.",
  5: "Apprendre à accepter le changement, l'imprévu, la liberté.",
  6: "Apprendre les responsabilités du cœur : le foyer, l'engagement, le soin.",
  7: "Apprendre à faire confiance à son intuition, à sa vie intérieure, à la foi.",
  8: "Apprendre à gérer l'argent et le pouvoir, à recevoir sa juste valeur.",
  9: "Apprendre la compassion, le détachement, l'ouverture aux autres.",
};

/** La passion cachée (chiffre le plus présent dans le nom) : ce qui la pousse en secret. */
export const SENS_PASSION: Record<number, string> = {
  1: "Le besoin de mener, d'être indépendante, de commencer.",
  2: "Le besoin de lien, de douceur, de vivre à deux.",
  3: "Le besoin de créer, de parler, de séduire, de briller.",
  4: "Le besoin de construire, d'ordre, de sécurité.",
  5: "Le besoin de liberté, d'aventure, de sensations.",
  6: "Le besoin d'aimer, de prendre soin, d'harmonie.",
  7: "Le besoin de comprendre, de chercher, de solitude.",
  8: "Le besoin de réussir, de diriger, d'abondance.",
  9: "Le besoin de donner, de servir, d'un idéal.",
};
