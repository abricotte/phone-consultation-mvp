// Les tests spirituels de l'espace — les types des fichiers de données.
// Deux familles, héritées du site : « par profils » (chaque réponse compte
// pour une lettre, le profil dominant gagne) et « par score » (chaque
// réponse vaut des points, des paliers donnent le résultat).

export type OptionProfil = { letter: string; text: string; category: string };
export type QuestionProfil = { title: string; options: OptionProfil[] };
export type ResultatProfil = {
  name: string;
  icon?: string;
  tagline: string;
  description: string;
  howItWorks?: string;
  signs?: string[];
  development?: string[];
  practices?: string;
  affirmation?: string;
  image?: { src: string; alt: string; width: number; height: number };
  links?: { href: string; label: string }[];
};
export type TestProfils = {
  mode: "profils";
  slug: string;
  title: string;
  subtitle: string;
  tag: string;
  intro: string[];
  questions: QuestionProfil[];
  results: Record<string, ResultatProfil>;
  fallbackCategory: string;
  spiritualMessage: string;
  spiritualMessageFallback: string;
  labels?: {
    secondaryTitle?: string;
    secondaryDescription?: string;
    profileTitle?: string;
    ctaDescription?: string;
  };
};

export type OptionScore = { icon?: string; text: string; score: number };
export type QuestionScore = { title: string; options: OptionScore[] };
export type ResultatScore = {
  icon?: string;
  title: string;
  subtitle: string;
  description: string;
  signs: string[];
  advice: { title: string; text: string }[];
};
export type TestScore = {
  mode: "score";
  slug: string;
  title: string;
  subtitle: string;
  tag: string;
  intro: string[];
  questions: QuestionScore[];
  /** du plus haut minScore au plus bas */
  resultRanges: { minScore: number; result: ResultatScore }[];
};

export type Test = TestProfils | TestScore;

/** Ce qu'on garde d'un test fait : le profil (sa clé et son nom), pas les réponses. */
export type ResultatEnregistre = {
  id: string;
  test: string;
  profil: string;
  titreProfil: string;
  score: number | null;
  creeLe: string;
};
