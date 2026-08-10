// Réglages personnels de la praticienne — conservés sur SON appareil.
// Ce sont des paramètres de pilotage (taux, seuils), pas des données
// métier : ils n'ont pas à transiter par le serveur ni à être partagés.

export interface Reglages {
  /** Assujettie à la TVA (auto-entreprise non franchisée) */
  tvaActive: boolean;
  /** Taux de TVA en % — 20 % pour une prestation de service en France */
  tvaTaux: number;
  /** Cotisations URSSAF, en % du CA HT — chiffre réel de sa déclaration */
  urssaf: number;
  /** Provision pour l'impôt sur le revenu, en % du CA HT */
  impot: number;
  /** Abonnements mensuels (Railway, Supabase, domaine…) en € */
  coutsFixes: number;
  /** Seuil d'alerte du solde Twilio, en devise du compte */
  seuilTwilio: number;
  /** Nombre de consultations à partir duquel une cliente est « habituée » */
  seuilHabituee: number;
}

export const REGLAGES_DEFAUT: Reglages = {
  tvaActive: true,
  tvaTaux: 20,
  urssaf: 26, // taux réel constaté sur la déclaration
  impot: 10, // volontairement un peu au-dessus du théorique, par prudence
  coutsFixes: 0,
  seuilTwilio: 5,
  seuilHabituee: 5,
};

const CLE = "reglagesCabinet";

// Bornes de sécurité : un réglage aberrant fausserait tous les calculs
function borner(r: Partial<Reglages>): Reglages {
  const entre = (v: unknown, min: number, max: number, defaut: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : defaut;
  };
  return {
    tvaActive: r.tvaActive !== false,
    tvaTaux: entre(r.tvaTaux, 0, 30, REGLAGES_DEFAUT.tvaTaux),
    urssaf: entre(r.urssaf, 0, 60, REGLAGES_DEFAUT.urssaf),
    impot: entre(r.impot, 0, 60, REGLAGES_DEFAUT.impot),
    coutsFixes: entre(r.coutsFixes, 0, 100000, REGLAGES_DEFAUT.coutsFixes),
    seuilTwilio: entre(r.seuilTwilio, 0, 1000, REGLAGES_DEFAUT.seuilTwilio),
    seuilHabituee: entre(r.seuilHabituee, 1, 100, REGLAGES_DEFAUT.seuilHabituee),
  };
}

export function chargerReglages(): Reglages {
  if (typeof window === "undefined") return REGLAGES_DEFAUT;
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return borner(JSON.parse(brut));

    // Reprise de l'ancien réglage : une provision unique devient URSSAF,
    // l'impôt prenant sa valeur par défaut.
    const ancien = localStorage.getItem("provisionPourcent");
    if (ancien !== null) {
      return borner({ ...REGLAGES_DEFAUT, urssaf: Number(ancien) });
    }
  } catch {
    /* réglages illisibles : on repart des valeurs par défaut */
  }
  return REGLAGES_DEFAUT;
}

export function enregistrerReglages(r: Partial<Reglages>): Reglages {
  const complet = borner({ ...chargerReglages(), ...r });
  if (typeof window !== "undefined") {
    localStorage.setItem(CLE, JSON.stringify(complet));
  }
  return complet;
}

export function enregistrerReglage<K extends keyof Reglages>(
  cle: K,
  valeur: Reglages[K]
): Reglages {
  return enregistrerReglages({ [cle]: valeur } as Partial<Reglages>);
}
