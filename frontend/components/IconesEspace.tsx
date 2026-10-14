// ICÔNES DE L'ESPACE CLIENTE — tracées, pas des emoji : un emoji change
// de dessin selon le téléphone, une icône tracée est la même partout.
// Trait 1,8 px, bouts ronds, 24×24. Toujours décoratives (aria-hidden) :
// le libellé qui les accompagne porte le sens.

export type NomIcone =
  | "etoile"
  | "lune"
  | "credit"
  | "profil"
  | "compte"
  | "appeler"
  | "reserver"
  | "modifier"
  | "fleche"
  // cabinet
  | "permanences"
  | "clientes"
  | "revenus"
  | "plus"
  | "croix"
  // l'espace, après le lancement
  | "livre"
  | "casque"
  | "boussole";

export function Icone({
  nom,
  taille = 18,
  className = "",
}: {
  nom: NomIcone;
  taille?: number;
  className?: string;
}) {
  const commun = {
    width: taille,
    height: taille,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    className: `shrink-0 ${className}`,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  switch (nom) {
    case "etoile":
      // Étoile à quatre branches, PLEINE — l'onglet d'accueil.
      return (
        <svg {...commun} fill="currentColor" strokeWidth={1}>
          <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
        </svg>
      );
    case "lune":
      return (
        <svg {...commun}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      );
    case "credit":
      return (
        <svg {...commun}>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.5a3 3 0 0 0-5 2.5 3 3 0 0 0 5 2.5M8 11h5M8 13h5" />
        </svg>
      );
    case "profil":
      return (
        <svg {...commun}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "compte":
      return (
        <svg {...commun}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
        </svg>
      );
    case "appeler":
      return (
        <svg {...commun}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "reserver":
      return (
        <svg {...commun}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "modifier":
      return (
        <svg {...commun}>
          <path d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4" />
        </svg>
      );
    case "fleche":
      return (
        <svg {...commun}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    // ── cabinet ──
    case "permanences":
      return (
        <svg {...commun}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "clientes":
      return (
        <svg {...commun}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2" />
        </svg>
      );
    case "revenus":
      return (
        <svg {...commun}>
          <path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6" />
        </svg>
      );
    case "plus":
      return (
        <svg {...commun}>
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case "croix":
      return (
        <svg {...commun}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    // ── l'espace, après le lancement ──
    case "livre":
      return (
        <svg {...commun}>
          <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13v4H6a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "casque":
      return (
        <svg {...commun}>
          <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
          <rect x="3" y="13" width="4" height="7" rx="1.5" />
          <rect x="17" y="13" width="4" height="7" rx="1.5" />
        </svg>
      );
    case "boussole":
      return (
        <svg {...commun}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </svg>
      );
  }
}
