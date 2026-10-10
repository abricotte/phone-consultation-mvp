// L'ESPACE CLIENTE — ses cinq routes et ses cinq onglets, en un seul
// endroit : le shell les affiche, le header et le footer globaux
// s'effacent dessus (le shell porte déjà le logo, un deuxième ferait
// doublon).
//
// La règle qui distribue Profil et Compte, énoncée par Elena : « le
// profil, c'est ce qu'Elena regarde ; le compte, c'est ce que le système
// utilise. » Profil = signe, proches, ce qu'elle veut aborder. Compte =
// email, numéro, mot de passe — la page qu'on visite deux fois par an.
// « Mon crédit » reste à part : l'argent est un registre différent.

export type IconeOnglet = "etoile" | "lune" | "credit" | "profil" | "compte";

export const ONGLETS_ESPACE: {
  href: string;
  label: string;
  /** Libellé de la barre d'onglets téléphone — court, sinon ça déborde */
  court: string;
  icone: IconeOnglet;
}[] = [
  { href: "/dashboard", label: "Mon espace", court: "Espace", icone: "etoile" },
  { href: "/consultations", label: "Consultations", court: "Consultations", icone: "lune" },
  { href: "/credit", label: "Mon crédit", court: "Crédit", icone: "credit" },
  { href: "/profil", label: "Profil", court: "Profil", icone: "profil" },
  { href: "/compte", label: "Compte", court: "Compte", icone: "compte" },
];

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
