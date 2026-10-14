// LES ANCIENS SAVOIRS DU THÈME ASTRAL — les tables de référence, portées
// du document d'Elena « Les anciens savoirs du thème astral — Histoire,
// significations et méthode complète de lecture » (14 octobre 2026).
//
// Trois niveaux, toujours affichés : « attesté » (textes, tablettes,
// techniques documentés), « traditionnel » (interprétation interne aux
// écoles anciennes), « adaptation » (reformulation d'aujourd'hui, signée
// Elena Wolska — jamais attribuée aux Anciens). Pas de fatalisme : une
// polarité, des conditions, une question — jamais une sentence.

export type Niveau = "attesté" | "traditionnel" | "adaptation";

export type ClePlanete = "soleil" | "lune" | "mercure" | "venus" | "mars" | "jupiter" | "saturne";
export type CleModerne = "uranus" | "neptune" | "pluton";

export const SIGNES: { nom: string; glyphe: string; maitre: ClePlanete; element: "feu" | "terre" | "air" | "eau"; mode: "cardinal" | "fixe" | "mutable"; sens: string; difficulte: string }[] = [
  { nom: "Bélier", glyphe: "♈", maitre: "mars", element: "feu", mode: "cardinal", sens: "impulsion, commencement, franchise, vitesse, désir d'ouvrir une voie", difficulte: "précipitation et conflit" },
  { nom: "Taureau", glyphe: "♉", maitre: "venus", element: "terre", mode: "fixe", sens: "stabilisation, matière, fécondité, possession, plaisir sensible, endurance", difficulte: "inertie et attachement" },
  { nom: "Gémeaux", glyphe: "♊", maitre: "mercure", element: "air", mode: "mutable", sens: "parole, échange, lettres, pluralité, curiosité", difficulte: "dispersion et duplicité" },
  { nom: "Cancer", glyphe: "♋", maitre: "lune", element: "eau", mode: "cardinal", sens: "génération, protection, foyer, réceptivité, mémoire", difficulte: "dépendance et variabilité émotionnelle" },
  { nom: "Lion", glyphe: "♌", maitre: "soleil", element: "feu", mode: "fixe", sens: "autorité, noblesse, rayonnement, courage, visibilité", difficulte: "orgueil et théâtralité" },
  { nom: "Vierge", glyphe: "♍", maitre: "mercure", element: "terre", mode: "mutable", sens: "analyse, discernement, service, technique, soin du détail", difficulte: "inquiétude et critique excessive" },
  { nom: "Balance", glyphe: "♎", maitre: "venus", element: "air", mode: "cardinal", sens: "accord, mesure, contrat, justice, échange, beauté", difficulte: "indécision ou paix de façade" },
  { nom: "Scorpion", glyphe: "♏", maitre: "mars", element: "eau", mode: "fixe", sens: "intensité, résistance, secret, crise, défense, ressources partagées", difficulte: "rancune et lutte de contrôle" },
  { nom: "Sagittaire", glyphe: "♐", maitre: "jupiter", element: "feu", mode: "mutable", sens: "expansion, voyage, enseignement, croyance, quête de sens", difficulte: "excès et certitude dogmatique" },
  { nom: "Capricorne", glyphe: "♑", maitre: "saturne", element: "terre", mode: "cardinal", sens: "ambition structurée, endurance, hiérarchie, gestion du temps, sobriété", difficulte: "dureté et pessimisme" },
  { nom: "Verseau", glyphe: "♒", maitre: "saturne", element: "air", mode: "fixe", sens: "organisation collective, pensée systémique, constance, réseaux", difficulte: "rigidité abstraite et distance" },
  { nom: "Poissons", glyphe: "♓", maitre: "jupiter", element: "eau", mode: "mutable", sens: "réceptivité, foi, imagination, compassion, dissolution des frontières", difficulte: "confusion et fuite" },
];

export const PLANETES: Record<ClePlanete, { nom: string; glyphe: string; nature: string; significations: string; constructif: string; difficile: string; domiciles: number[]; exaltation: number; secte: "diurne" | "nocturne" | "variable" }> = {
  soleil: { nom: "Soleil", glyphe: "☉", nature: "luminaire diurne ; chaleur et sécheresse modérées", significations: "vie, visibilité, autorité, honneur, rang, volonté directrice, figures de puissance", constructif: "clarté, noblesse, cohérence, rayonnement", difficile: "orgueil, domination, surexposition", domiciles: [4], exaltation: 0, secte: "diurne" },
  lune: { nom: "Lune", glyphe: "☽", nature: "luminaire nocturne ; froide et humide ; très rapide", significations: "corps, croissance, mère, nourriture, habitudes, fluctuations, déplacements", constructif: "adaptation, fécondité, sensibilité au milieu, mémoire incarnée", difficile: "instabilité, passivité, dépendance, dispersion", domiciles: [3], exaltation: 1, secte: "nocturne" },
  mercure: { nom: "Mercure", glyphe: "☿", nature: "nature variable, commune aux deux sectes", significations: "parole, écriture, calcul, commerce, interprétation, apprentissage, médiation", constructif: "intelligence technique, éloquence, discernement", difficile: "tromperie, nervosité, instabilité, excès d'analyse", domiciles: [2, 5], exaltation: 5, secte: "variable" },
  venus: { nom: "Vénus", glyphe: "♀", nature: "bénéfique nocturne ; tempérée", significations: "union, amour, beauté, plaisir, accord, arts, désir, cadeaux", constructif: "conciliation, charme, création, sociabilité", difficile: "complaisance, excès sensuel, dépendance au plaisir, séduction intéressée", domiciles: [1, 6], exaltation: 11, secte: "nocturne" },
  mars: { nom: "Mars", glyphe: "♂", nature: "maléfique nocturne ; chaud et sec", significations: "coupure, conflit, force, courage, compétition, décision", constructif: "décision, audace, défense, capacité de trancher", difficile: "violence, blessure, querelle, précipitation", domiciles: [0, 7], exaltation: 9, secte: "nocturne" },
  jupiter: { nom: "Jupiter", glyphe: "♃", nature: "bénéfique diurne ; chaud et humide, tempéré", significations: "expansion, justice, alliance, foi, sagesse, richesse, protection, enfants", constructif: "générosité, confiance, légitimité, croissance, bienveillance", difficile: "excès, inflation, présomption, promesses démesurées", domiciles: [8, 11], exaltation: 3, secte: "diurne" },
  saturne: { nom: "Saturne", glyphe: "♄", nature: "maléfique diurne ; froid et sec ; le plus lent", significations: "temps, limite, séparation, endurance, structure, accumulation", constructif: "discipline, profondeur, persévérance, structure, conservation", difficile: "peur, retard, privation, isolement, rigidité, mélancolie", domiciles: [9, 10], exaltation: 6, secte: "diurne" },
};

// Extensions modernes : hors de la restitution ancienne, dans une section à part.
export const MODERNES: Record<CleModerne, { nom: string; glyphe: string; mot: string }> = {
  uranus: { nom: "Uranus", glyphe: "♅", mot: "découverte en 1781 : la rupture, l'imprévu, l'indépendance — lecture moderne" },
  neptune: { nom: "Neptune", glyphe: "♆", mot: "découverte en 1846 : le flou, l'inspiration, la dissolution — lecture moderne" },
  pluton: { nom: "Pluton", glyphe: "♇", mot: "découverte en 1930 : la transformation, la profondeur, le pouvoir — lecture moderne" },
};

export const MAISONS: { num: number; romain: string; nomAncien: string; sens: string; question: string; joie?: ClePlanete; force: "angulaire" | "succédente" | "cadente" }[] = [
  { num: 1, romain: "I", nomAncien: "Horoskopos, le gouvernail", sens: "corps, vie, souffle, tempérament, apparence, commencement, direction de l'existence", question: "Comment entrez-vous dans la vie, et comment la conduisez-vous ?", joie: "mercure", force: "angulaire" },
  { num: 2, romain: "II", nomAncien: "la porte d'Hadès", sens: "ressources, moyens de subsistance, acquisitions, possessions", question: "Avec quoi soutenez-vous matériellement votre vie ?", force: "succédente" },
  { num: 3, romain: "III", nomAncien: "la Déesse", sens: "fratrie, proches, voisinage, messages, petits déplacements, rites quotidiens", question: "Comment circulez-vous dans votre environnement proche et vos liens familiers ?", joie: "lune", force: "cadente" },
  { num: 4, romain: "IV", nomAncien: "le Souterrain", sens: "foyer, terre, parents ou ancêtres, origine, fin des choses", question: "Sur quelles racines reposez-vous, et qu'est-ce qui demeure à la fin ?", force: "angulaire" },
  { num: 5, romain: "V", nomAncien: "la Bonne Fortune", sens: "enfants, fécondité, plaisir, dons, créations, réjouissances, amitiés", question: "Qu'engendrez-vous, et qu'est-ce qui vous procure joie et continuité ?", joie: "venus", force: "succédente" },
  { num: 6, romain: "VI", nomAncien: "la Mauvaise Fortune", sens: "maladie, blessure, travail contraint, tâches pénibles", question: "Où le corps rencontre-t-il effort, déséquilibre ou subordination ?", joie: "mars", force: "cadente" },
  { num: 7, romain: "VII", nomAncien: "le Couchant", sens: "mariage, partenaire, contrats, adversaires déclarés, voyage ou destination", question: "Qui se tient en face : allié, partenaire ou opposant ?", force: "angulaire" },
  { num: 8, romain: "VIII", nomAncien: "le lieu inactif", sens: "héritages, biens du partenaire, peur, pertes, vulnérabilité", question: "Qu'est-ce qui échappe au contrôle personnel et passe par la perte ou autrui ?", force: "succédente" },
  { num: 9, romain: "IX", nomAncien: "le Dieu", sens: "religion, divination, rêves, visions, sagesse, enseignement supérieur, voyages lointains", question: "Quel sens supérieur, quelle connaissance, quel horizon guide votre vie ?", joie: "soleil", force: "cadente" },
  { num: 10, romain: "X", nomAncien: "le Milieu du Ciel, la praxis", sens: "action, métier, autorité, honneur, réputation, accomplissement public", question: "Quelle œuvre devient visible et reconnue ?", force: "angulaire" },
  { num: 11, romain: "XI", nomAncien: "le Bon Esprit", sens: "amis, alliés, patrons, espérances, bénéfices, soutien collectif", question: "Quels réseaux, protections et projets favorisent votre accomplissement ?", joie: "jupiter", force: "succédente" },
  { num: 12, romain: "XII", nomAncien: "le Mauvais Esprit", sens: "retrait, isolement, adversités invisibles, auto-entrave, travail intérieur", question: "Qu'est-ce qui agit hors du regard, isole, ou oblige au retrait ?", joie: "saturne", force: "cadente" },
];

export const ASPECTS: Record<string, { nom: string; angle: number; nature: string; lecture: string }> = {
  conjonction: { nom: "conjonction", angle: 0, nature: "fusion ou coprésence", lecture: "les planètes doivent agir ensemble ; le résultat dépend de leurs natures et de leurs conditions" },
  sextile: { nom: "sextile", angle: 60, nature: "harmonieux, modérément favorable", lecture: "possibilité, coopération, ouverture qui demande une activation" },
  carre: { nom: "carré", angle: 90, nature: "difficile ou conflictuel", lecture: "friction, obstacle, action forcée, tension à résoudre" },
  trigone: { nom: "trigone", angle: 120, nature: "harmonieux et fluide", lecture: "soutien naturel, affinité, facilité de circulation" },
  opposition: { nom: "opposition", angle: 180, nature: "polarisation", lecture: "face-à-face, négociation, complémentarité ou conflit" },
};

export const DIGNITES: Record<string, { sens: string; metaphore: string }> = {
  domicile: { sens: "pleine autorité dans son propre signe", metaphore: "la planète est chez elle et décide" },
  exaltation: { sens: "honneur, élévation, efficacité prestigieuse", metaphore: "invitée d'honneur, puissante mais pas propriétaire" },
  peregrine: { sens: "aucune dignité essentielle majeure", metaphore: "voyageuse sans statut local" },
  exil: { sens: "signe opposé au domicile", metaphore: "action en territoire étranger" },
  chute: { sens: "signe opposé à l'exaltation", metaphore: "perte de rang ou de moyens habituels" },
};

export const TEMPERAMENTS: Record<string, string> = {
  feu: "colérique — chaud et sec : initiative, intensité, réaction",
  air: "sanguin — chaud et humide : sociabilité, mobilité, croissance",
  terre: "mélancolique — froid et sec : concentration, retenue, durée",
  eau: "flegmatique — froid et humide : réceptivité, lenteur, adaptation",
};

export const REPERES_HISTORIQUES: { titre: string; texte: string }[] = [
  { titre: "Mésopotamie", texte: "Deux millénaires de sciences astrales. Les grands corpus de présages (Enūma Anu Enlil, près de 7 000 présages) parlaient au roi et au royaume ; puis le passage décisif du présage collectif au destin individuel : le zodiaque de douze signes égaux, les significations planétaires, les premiers relevés de naissance. Les plus anciens thèmes individuels conservés datent de 410 av. J.-C., sans ascendant ni maisons encore." },
  { titre: "Égypte et monde hellénistique", texte: "L'Égypte apportait les décans ; le zodiaque y entre à l'époque ptolémaïque. La synthèse gréco-égyptienne ajoute l'ascendant, les douze lieux, les aspects, les dignités, les lots — la forme reconnaissable de l'horoscope. Les textes : Dorothée de Sidon, Ptolémée (Tetrabiblos), Vettius Valens, Manilius, Firmicus Maternus." },
  { titre: "Inde, Perse, monde arabe", texte: "L'Inde reçoit l'horoscopie grecque et la fond avec ses nakshatras (le Yavanajātaka). Les traductions persanes et arabes, Abū Maʿshar en tête, transmettent, systématisent et enrichissent — révolutions annuelles, lots, maîtres du temps — avant les réélaborations médiévales et renaissantes." },
];

export const LIMITES = [
  "L'astrologie est une pratique symbolique et historique, pas une science validée : le test en double aveugle de Shawn Carlson (Nature, 1985) n'a pas montré que des astrologues associaient mieux que le hasard des thèmes à des profils.",
  "Ce thème est un langage réflexif. Il ne diagnostique rien, ne prédit rien avec certitude, ne remplace ni un médecin, ni un psychologue, ni un conseil juridique ou financier.",
  "Une erreur de quelques minutes sur l'heure peut déplacer l'ascendant. Sans heure connue, les maisons ne sont pas calculées : on n'invente pas.",
  "Les mots d'aujourd'hui (« mission d'âme », « vies antérieures » lues aux nœuds, Uranus maître du Verseau…) sont des créations contemporaines ; elles sont étiquetées comme telles, jamais attribuées aux Anciens.",
];

export const ETAPES_LECTURE: [string, string][] = [
  ["Vérifier les données", "date, heure la plus exacte possible, lieu, fuseau historique, degré d'incertitude."],
  ["Définir le système", "zodiaque tropical, maisons en signes entiers, sept planètes traditionnelles, modernes à part, orbes, formules des lots."],
  ["Déterminer la secte", "thème diurne ou nocturne : le luminaire de secte, le bénéfique et le maléfique de secte."],
  ["Lire l'ascendant", "le signe qui se lève, son maître — où il est, dans quelle condition — et ce qui se tient en maison I."],
  ["Évaluer chaque planète", "nature, fonction, lieu, style, ressources, secte, puissance, état, relations, activation."],
  ["Lire les maisons par leurs maîtres", "une maison vide n'est pas inactive : son maître raconte le sujet."],
  ["Repérer les répétitions", "une affirmation vaut quand plusieurs témoins indépendants la répètent ; jamais un facteur isolé."],
  ["Hiérarchiser, puis formuler sans fatalisme", "une polarité, des conditions d'expression, des pistes de conscience — jamais une sentence."],
];
