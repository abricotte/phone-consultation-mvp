// LA BIBLIOTHÈQUE D'ELENA — les livres qui ont nourri son chemin, repris de
// la page « Bibliographie » de son ancien site WordPress (octobre 2025,
// retrouvée dans la sauvegarde du 1er mars 2026). Ses mots, ses rubriques,
// ses coups de cœur (⭐) et ses petites notes, tels quels.

export type Livre = { titre: string; auteur: string; coeur?: boolean; note?: string };
export type Rayon = { cle: string; nom: string; signe: string; livres: Livre[]; intro?: string };

export const INTRO = "Plus de 100 livres qui ont éclairé, nourri et transformé mon chemin spirituel. Des lectures qui enrichissent mes consultations et nourrissent mon âme.";
export const CITATION = "Un livre arrive toujours au moment exact où vous en avez besoin. Laissez-vous guider par votre intuition dans cette bibliothèque.";

export const PREFERE = {
  titre: "De nombreuses demeures",
  auteur: "Gina Cerminara",
  texte: "Ce livre remarquable nous invite à explorer la théorie des vies antérieures par le prisme des lectures d'Edgar Cayce, figure emblématique de la métaphysique. L'auteur y dévoile comment nos comportements répétitifs trouvent leur origine dans nos karmas hérités d'existences précédentes. Un ouvrage absolument passionnant qui se lit d'une traite ! Mon préféré sans aucune hésitation !",
};

export const RAYONS: Rayon[] = [
  { cle: "voyance", nom: "Voyance & Médiumnité", signe: "☽", livres: [
    { titre: "Aventures d'une voyante", auteur: "Sylvia Browne" },
    { titre: "Le Don de voyance", auteur: "Ted Andrews" },
    { titre: "Développez vos facultés psychiques", auteur: "Serge Boutboul" },
    { titre: "Messages de l'Au-delà", auteur: "James Van Praagh" },
    { titre: "La Voie du médium", auteur: "Stéphane Allix" },
    { titre: "Journal d'un éveil du 3ème œil", auteur: "Samuel Sagan" },
    { titre: "Somnambulisme et médiumnité", auteur: "Bertrand Méheust", note: "Lecture fluide et accessible" },
  ] },
  { cle: "karma", nom: "Karma & Vies antérieures", signe: "∞", livres: [
    { titre: "De nombreuses vies, de nombreux maîtres", auteur: "Brian Weiss", coeur: true },
    { titre: "Souvenirs de vies antérieures", auteur: "Brian Weiss" },
    { titre: "Messages des Maîtres", auteur: "Brian Weiss" },
    { titre: "The Convoluted Universe (Tome 2)", auteur: "Dolores Cannon" },
    { titre: "De nombreuses demeures", auteur: "Gina Cerminara" },
    { titre: "Les ouvrages d'Edgar Cayce", auteur: "Edgar Cayce" },
    { titre: "20 cas suggérant la réincarnation", auteur: "Ian Stevenson", note: "Accessible et fascinant" },
    { titre: "Karma et Réincarnation", auteur: "Édouard Schuré" },
    { titre: "La Roue de la Vie", auteur: "Elisabeth Kübler-Ross" },
    { titre: "L'Expérience de la vie après la mort", auteur: "Raymond Moody" },
  ] },
  { cle: "amour", nom: "Amour & Relations d'âme", signe: "♡", livres: [
    { titre: "Le Prophète", auteur: "Khalil Gibran", coeur: true },
    { titre: "Les Âmes sœurs", auteur: "Thomas Moore" },
    { titre: "L'Amour sans condition", auteur: "Louise Hay" },
    { titre: "Les Quatre Accords Toltèques", auteur: "Don Miguel Ruiz" },
    { titre: "La Maîtrise de l'amour", auteur: "Don Miguel Ruiz" },
    { titre: "Aimer ce qui est", auteur: "Byron Katie" },
    { titre: "Le Chemin le moins fréquenté", auteur: "Scott Peck" },
    { titre: "L'Art d'aimer", auteur: "Erich Fromm" },
    { titre: "Retour à l'amour", auteur: "Marianne Williamson" },
  ] },
  { cle: "conscience", nom: "Conscience & Présence", signe: "○", livres: [
    { titre: "Le Pouvoir du moment présent", auteur: "Eckhart Tolle" },
    { titre: "Nouvelle Terre", auteur: "Eckhart Tolle" },
    { titre: "Le Miracle de la pleine conscience", auteur: "Thich Nhat Hanh" },
    { titre: "La Voie du cœur", auteur: "Jayem (Jeshua)" },
    { titre: "Autobiographie d'un Yogi", auteur: "Paramahansa Yogananda", coeur: true },
    { titre: "Le Livre tibétain de la vie et de la mort", auteur: "Sogyal Rinpoché" },
  ] },
  { cle: "energie", nom: "Énergie & Lois universelles", signe: "✧", livres: [
    { titre: "Le Kybalion", auteur: "Les Trois Initiés" },
    { titre: "Les Lois spirituelles", auteur: "Dan Millman" },
    { titre: "La Prophétie des Andes", auteur: "James Redfield" },
    { titre: "Le Corps Quantique", auteur: "Dr Deepak Chopra" },
    { titre: "Les 7 lois spirituelles du succès", auteur: "Deepak Chopra" },
    { titre: "Lucidité et Intuition", auteur: "Eugène Osty", note: "Passerelle science et perception subtile" },
    { titre: "Le Secret", auteur: "Rhonda Byrne" },
    { titre: "Demandez et vous recevrez", auteur: "Esther et Jerry Hicks" },
  ] },
  { cle: "guerison", nom: "Transformation & Guérison", signe: "❋", livres: [
    { titre: "Les 5 blessures qui empêchent d'être soi-même", auteur: "Lise Bourbeau" },
    { titre: "Les 9 visages du cœur", auteur: "Daniel Meurois" },
    { titre: "Les Dialogues avec l'Ange", auteur: "Gitta Mallasz" },
    { titre: "La Mort et son Mystère", auteur: "Camille Flammarion", note: "Poétique et universel" },
    { titre: "Le Jeu de la Vie et comment le jouer", auteur: "Florence Scovel Shinn" },
    { titre: "Vous pouvez guérir votre vie", auteur: "Louise Hay" },
    { titre: "La Nuit obscure de l'âme", auteur: "Thomas Moore" },
    { titre: "L'Alchimiste", auteur: "Paulo Coelho", coeur: true },
  ] },
  { cle: "feminin", nom: "Féminin sacré", signe: "☾", livres: [
    { titre: "Femmes qui courent avec les loups", auteur: "Clarissa Pinkola Estés" },
    { titre: "Lune Rouge", auteur: "Miranda Gray" },
    { titre: "L'Âme du monde", auteur: "Frédéric Lenoir" },
  ] },
  { cle: "anges", nom: "Guides & Anges", signe: "✶", livres: [
    { titre: "Les Anges dans nos vies", auteur: "Doreen Virtue" },
    { titre: "Guérir avec l'aide des anges", auteur: "Doreen Virtue" },
    { titre: "Connectez-vous à vos guides spirituels", auteur: "Sonia Choquette" },
    { titre: "Les Messages de vos anges", auteur: "Doreen Virtue" },
  ] },
  { cle: "animaux", nom: "Animaux guides", signe: "❦", livres: [
    { titre: "Quand le cheval guide l'homme", auteur: "Patrice Van Eersel" },
    { titre: "Le Peuple animal", auteur: "Marc Giraud" },
    { titre: "Les Animaux totems et leurs messages", auteur: "Ted Andrews" },
    { titre: "Les Animaux de pouvoir", auteur: "Lily Baron" },
    { titre: "Communication animale et intuition", auteur: "Laila del Monte" },
    { titre: "Les Pouvoirs inexpliqués des animaux", auteur: "Rupert Sheldrake", note: "Champ morphique et intuition" },
  ] },
  { cle: "sacres", nom: "Textes sacrés", signe: "☉", livres: [
    { titre: "Le Tao Te King", auteur: "Lao Tseu" },
    { titre: "Le Livre des Esprits", auteur: "Allan Kardec" },
    { titre: "Bhagavad Gita", auteur: "Texte hindou" },
    { titre: "Les Upanishads", auteur: "Textes védiques" },
    { titre: "Un Cours en Miracles", auteur: "Helen Schucman" },
    { titre: "Conversations avec Dieu (tomes 1-3)", auteur: "Neale Donald Walsch" },
    { titre: "Siddhartha", auteur: "Hermann Hesse" },
  ] },
  { cle: "chamanisme", nom: "Chamanisme", signe: "♆", livres: [
    { titre: "Le Voyage chamanique", auteur: "Sandra Ingerman" },
    { titre: "Chamanisme", auteur: "Mircea Eliade" },
    { titre: "Les Enseignements de Don Juan", auteur: "Carlos Castaneda" },
    { titre: "Pieds nus sur la Terre sacrée", auteur: "T.C. McLuhan" },
  ] },
  { cle: "cristaux", nom: "Cristaux & Énergies", signe: "◇", livres: [
    { titre: "La Bible des Cristaux (tomes 1-3)", auteur: "Judy Hall" },
    { titre: "Le Pouvoir des pierres et des cristaux", auteur: "Michael Gienger" },
    { titre: "Cristaux et Santé", auteur: "Régina Martino" },
  ] },
  { cle: "subtil", nom: "Science du subtil & Univers", signe: "✺", intro: "Une dernière catégorie que j'explore en ce moment… Là où la science, la conscience et l'âme se rejoignent.", livres: [
    { titre: "La Biologie des croyances", auteur: "Bruce Lipton", coeur: true },
    { titre: "Les Univers Parallèles", auteur: "Brian Greene" },
    { titre: "Les Trous Noirs et l'Univers", auteur: "Stephen Hawking" },
    { titre: "Transurfing (tomes 1 à 5)", auteur: "Vadim Zeland" },
    { titre: "Les romans de Philip K. Dick", auteur: "Philip K. Dick", note: "Vision métaphysique du réel" },
    { titre: "La Synchronicité, l'Âme et la Science", auteur: "Hubert Reeves, Michel Cazenave" },
    { titre: "Fantastiques expériences de voyage astral", auteur: "Robert Monroe" },
    { titre: "The Conscious Universe", auteur: "Dean Radin", note: "Preuve scientifique du psi" },
    { titre: "L'Univers informé", auteur: "Lynne McTaggart" },
    { titre: "Le Champ de cohérence universelle", auteur: "Ervin László" },
  ] },
];
