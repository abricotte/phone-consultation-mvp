// LA MINUTE VOYANCE — le podcast d'Elena, une carte de Mademoiselle
// Lenormand par épisode. Les épisodes et leurs mots viennent de la page
// Spotify du podcast (relevés le 16 octobre 2026 : cartes 1 à 13). Les
// cartes suivantes attendent leur épisode : ajouter l'identifiant Spotify
// (la fin du lien open.spotify.com/episode/…) et ses trois mots.

export const SPOTIFY_PODCAST = "https://open.spotify.com/show/19rxAXVwo3fTG1RJAV7Y4R";

export type CarteMinute = { numero: number; nom: string; mots?: string; episode?: string; duree?: string };

export const CARTES_MINUTE: CarteMinute[] = [
  { numero: 1, nom: "Le Cavalier", mots: "Mouvement, passion et opportunités", episode: "15FG56qLFsCl0ddF5XwY7X" },
  { numero: 2, nom: "Le Trèfle", mots: "Chance, opportunité et petit bonheur", episode: "6OkN9DN7QlIKVe8CuXE2n9" },
  { numero: 3, nom: "Le Bateau", mots: "Voyage, exploration et action", episode: "0uqDw6FnFwTsizEjzy9DDm" },
  { numero: 4, nom: "La Maison", mots: "Sécurité, famille, stabilité", episode: "2gQW2sT47bDtnL54DP8nIj" },
  { numero: 5, nom: "L'Arbre", mots: "Guérison, karma, patience", episode: "2IfwSQESO5mWGhbWbjkn3t" },
  { numero: 6, nom: "Le Nuage", mots: "Trouble, confusion, soucis", episode: "4dhd4qBD4DWbOagPKaa4wC" },
  { numero: 7, nom: "Le Serpent", mots: "Dualité, trahison, transformation", episode: "0hw02HQK8LBDLFa8JR8gRP" },
  { numero: 8, nom: "Le Cercueil", mots: "Deuil, séparation, renaissance", episode: "22dDbjekTeo9l2VeggXBDA", duree: "2 min 14" },
  { numero: 9, nom: "Le Bouquet", mots: "Joie, bonheur, épanouissement", episode: "1W8K8F3w7ru0iFeAcIHZgG", duree: "2 min 12" },
  { numero: 10, nom: "La Faux", mots: "Césure, séparation, danger", episode: "25YXuPFADXp2Oa4gk6JQPx", duree: "1 min 51" },
  { numero: 11, nom: "Le Fouet", mots: "Conflits, colère, violence", episode: "1yu11QhQI1iArCA22itRlR", duree: "1 min 44" },
  { numero: 12, nom: "Les Oiseaux", mots: "Communication, nouvelles, légèreté", episode: "3NpKM2H6kTurEfMfqgn2L1", duree: "1 min 38" },
  { numero: 13, nom: "L'Enfant", mots: "Renouveau, renaissance, nouveau projet", episode: "7gxJk1l3OFJRKxKGuGuH9F", duree: "1 min 43" },
  { numero: 14, nom: "Le Renard" },
  { numero: 15, nom: "L'Ours" },
  { numero: 16, nom: "Les Étoiles" },
  { numero: 17, nom: "La Cigogne" },
  { numero: 18, nom: "Le Chien" },
  { numero: 19, nom: "La Tour" },
  { numero: 20, nom: "Le Jardin" },
  { numero: 21, nom: "La Montagne" },
  { numero: 22, nom: "Les Chemins" },
  { numero: 23, nom: "Les Souris" },
  { numero: 24, nom: "Le Cœur" },
  { numero: 25, nom: "La Bague" },
  { numero: 26, nom: "Le Livre" },
  { numero: 27, nom: "La Lettre" },
  { numero: 28, nom: "L'Homme" },
  { numero: 29, nom: "La Femme" },
  { numero: 30, nom: "Les Lys" },
  { numero: 31, nom: "Le Soleil" },
  { numero: 32, nom: "La Lune" },
  { numero: 33, nom: "La Clé" },
  { numero: 34, nom: "Les Poissons" },
  { numero: 35, nom: "L'Ancre" },
  { numero: 36, nom: "La Croix" },
];
