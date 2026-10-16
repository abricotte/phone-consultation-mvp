// L'ESPACE CLIENTE — ses routes et son menu, en un seul endroit : le shell
// les affiche, le header et le footer globaux s'effacent dessus (le shell
// porte déjà le logo, un deuxième ferait doublon).
//
// Le menu en trois registres (décision d'Elena, 14 octobre 2026) :
//
//   consulter        Mon espace · Consultations · Mon crédit
//   MON UNIVERS      ce qu'elle a, seule : son profil, ses tirages, ses
//                    études (« Méthode Wolska »), ses tests
//   AVEC ELENA       ce qu'elle fait avec Elena : le salon, apprendre,
//                    les voyages
//   le compte        Paramètres — ce que le système utilise (compte, numéro, mot de passe)
//
// Douze lignes, c'est la limite : toute nouveauté remplace ou s'abrite
// sous une entrée existante. Et on n'ouvre pas une pièce vide — une page
// « bientôt » dit au moins ce qui vient.

import type { NomIcone } from "@/components/IconesEspace";

export interface OngletEspace {
  href: string;
  label: string;
  /** Libellé de la barre d'onglets téléphone — court, sinon ça déborde */
  court: string;
  icone: NomIcone;
}

export interface GroupeEspace {
  /** Intertitre doré au-dessus du groupe ; null pour le dernier */
  titre: string | null;
  /** Le groupe « appeler » : dessiné à part, dans un encadré de couleur (Elena, 15 octobre) */
  appel?: boolean;
  onglets: OngletEspace[];
}

export const GROUPES_ESPACE: GroupeEspace[] = [
  {
    // Tout ce qui sert à appeler, compartimenté dans un encadré de couleur :
    // la cliente qui veut appeler ne se perd pas (Elena, 15 octobre).
    titre: "Consulter Elena",
    appel: true,
    onglets: [
      { href: "/dashboard", label: "Mon espace", court: "Espace", icone: "etoile" },
      { href: "/consultations", label: "Consultations", court: "Consult.", icone: "lune" },
      { href: "/credit", label: "Mon crédit", court: "Crédit", icone: "credit" },
    ],
  },
  {
    titre: "Mon univers",
    onglets: [
      // Ordre d'Elena (14 octobre) : profil, études, tirages, tests.
      { href: "/profil", label: "Mon profil", court: "Profil", icone: "profil" },
      { href: "/etudes", label: "Mes études", court: "Études", icone: "livre" },
      { href: "/tirages", label: "Mes tirages", court: "Tirages", icone: "reserver" },
      { href: "/tests", label: "Tests spirituels", court: "Tests", icone: "clientes" },
    ],
  },
  {
    titre: "Avec Elena",
    onglets: [
      { href: "/salon", label: "Le salon", court: "Salon", icone: "casque" },
      { href: "/apprendre", label: "Apprendre", court: "Apprendre", icone: "modifier" },
      // Tout ce qui s'achète, en vitrine : carnets, jeux, oracle (Elena, 15 octobre)
      { href: "/librairie", label: "La librairie", court: "Librairie", icone: "livre" },
      // Les mystères : tous les « et si… » qui bousculent notre regard sur la réalité (Elena, 16 octobre)
      { href: "/mysteres", label: "Les mystères", court: "Mystères", icone: "oeil" },
      // Voyages spirituels : en off tant que ce n'est pas abouti (Elena, 14 octobre) — la page reste, hors menu.
      // { href: "/voyages", label: "Voyages spirituels", court: "Voyages", icone: "boussole" },
    ],
  },
  {
    titre: null,
    onglets: [{ href: "/compte", label: "Paramètres", court: "Réglages", icone: "compte" }],
  },
];

export const ONGLETS_ESPACE: OngletEspace[] = GROUPES_ESPACE.flatMap((g) => g.onglets);

/** Sous le pouce, sur téléphone : quatre entrées ; le reste dans « Plus » */
export const SOUS_LE_POUCE = ["/dashboard", "/profil", "/tirages", "/credit"];

/** Vrai sur les pages de l'espace cliente */
export function estRouteEspace(pathname: string | null): boolean {
  if (!pathname) return false;
  return ONGLETS_ESPACE.some(
    (o) => pathname === o.href || pathname.startsWith(o.href + "/")
  );
}

/** Vrai là où le header et le footer du site s'effacent : l'espace
 *  cliente et le cabinet — chacun a son shell, qui porte le logo. */
export function sansChromeGlobal(pathname: string | null): boolean {
  if (!pathname) return false;
  return estRouteEspace(pathname) || pathname === "/cabinet-ew" || pathname.startsWith("/cabinet-ew/");
}
