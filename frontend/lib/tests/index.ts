// Le catalogue des tests spirituels : quinze, tous écrits par Elena. Sept
// sont portés (données dans ce dossier) ; huit viennent de l'ancien site
// WordPress et restent « bientôt » le temps d'en extraire les données.

import type { Test } from "./types";
import amourPlacebo from "./amour-placebo";
import quelAmour from "./quel-amour-vous-attend";
import donSpirituel from "./don-spirituel";
import contratDame from "./contrat-dame";
import relationKarmique from "./relation-karmique";
import schemaAmoureux from "./schema-amoureux";
import flammeJumelle from "./flamme-jumelle";

export type EntreeCatalogue = {
  slug: string;
  titre: string;
  question: string;
  duree: string;
  test?: Test;
};

export const CATALOGUE: EntreeCatalogue[] = [
  { slug: "relation-karmique", titre: "Suis-je dans une relation karmique ?", question: "Pourquoi cette histoire revient, encore.", duree: "5 min", test: relationKarmique },
  { slug: "contrat-dame", titre: "Quel est mon contrat d'âme ?", question: "Ce que votre âme est venue apprendre avec l'autre.", duree: "8 min", test: contratDame },
  { slug: "flamme-jumelle", titre: "Est-ce votre flamme jumelle ?", question: "Évidence, tendresse, apprentissage ou miroir ?", duree: "6 min", test: flammeJumelle },
  { slug: "schema-amoureux", titre: "Quel est mon schéma amoureux répétitif ?", question: "Ce que vous rejouez sans le vouloir.", duree: "7 min", test: schemaAmoureux },
  { slug: "amour-placebo", titre: "Êtes-vous dans un amour placebo ?", question: "Un lien vrai, ou un vide comblé ?", duree: "4 min", test: amourPlacebo },
  { slug: "quel-amour-vous-attend", titre: "Quel amour vous attend ?", question: "Celui que vous êtes prête à recevoir.", duree: "5 min", test: quelAmour },
  { slug: "don-spirituel", titre: "Quel est mon don spirituel ?", question: "Clairvoyance, empathie, magnétisme…", duree: "8 min", test: donSpirituel },
  // De l'ancien site — données à porter
  { slug: "type-de-lien", titre: "Quel type de lien d'âme vivez-vous ?", question: "Flamme jumelle, âme sœur ou lien karmique.", duree: "6 min" },
  { slug: "blessures-dame", titre: "Quelles sont vos blessures d'âme ?", question: "Rejet, abandon, humiliation, trahison, injustice.", duree: "10 min" },
  { slug: "lecon-karmique", titre: "Quelle leçon karmique cette relation vous enseigne ?", question: "Ce qu'elle est venue vous apprendre.", duree: "7 min" },
  { slug: "mission-de-vie", titre: "Quelle est votre mission de vie ?", question: "Vos talents, votre dharma.", duree: "8 min" },
  { slug: "vie-anterieure", titre: "Avez-vous déjà rencontré cette âme dans une vie antérieure ?", question: "Ce sentiment de déjà-connu.", duree: "6 min" },
  { slug: "profil-celibataire", titre: "Quel est votre profil de célibataire ?", question: "Comment vous vivez le temps entre deux.", duree: "6 min" },
  { slug: "changement-2026", titre: "Quel changement majeur arrive dans votre vie amoureuse ?", question: "Ce qui se prépare cette année.", duree: "7 min" },
  { slug: "liens-ou-ames-soeurs", titre: "Attirez-vous liens karmiques ou âmes sœurs ?", question: "Ce que vous attirez, et pourquoi.", duree: "6 min" },
];

export const TESTS_PAR_SLUG: Record<string, Test> = Object.fromEntries(
  CATALOGUE.filter((e) => e.test).map((e) => [e.slug, e.test as Test])
);

export function entreeParSlug(slug: string): EntreeCatalogue | undefined {
  return CATALOGUE.find((e) => e.slug === slug);
}

/** Le nom du profil obtenu, pour un résultat enregistré. */
export function nomProfil(test: Test, profil: string): string {
  if (test.mode === "profils") return test.results[profil]?.name ?? profil;
  const r = test.resultRanges.find((x) => String(x.minScore) === profil);
  return r?.result.title ?? profil;
}
