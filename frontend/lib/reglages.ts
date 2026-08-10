// Réglages personnels de la praticienne — conservés sur SON appareil.
// Ce sont des paramètres de pilotage (taux, seuils), pas des données
// métier : ils n'ont pas à transiter par le serveur ni à être partagés.

export interface Reglages {
  /** Assujettie à la TVA (auto-entreprise non franchisée) */
  tvaActive: boolean;
  /** Taux de TVA en % — 20 % pour une prestation de service en France */
  tvaTaux: number;
  /** Provision pour cotisations sociales et impôt, en % du CA HT */
  provision: number;
  /** Abonnements mensuels (Railway, Supabase, domaine…) en € */
  coutsFixes: number;
  /** Seuil d'alerte du solde Twilio, en devise du compte */
  seuilTwilio: number;
  /** Nombre de consultations à partir duquel une cliente est « habituée » */
  seuilHabituee: number;
}

export const REGLAGES_DEFAUT: Reglages = {
  tvaActive: false,
  tvaTaux: 20,
  provision: 25,
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
    tvaActive: r.tvaActive === true,
    tvaTaux: entre(r.tvaTaux, 0, 30, REGLAGES_DEFAUT.tvaTaux),
    provision: entre(r.provision, 0, 90, REGLAGES_DEFAUT.provision),
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

    // Reprise de l'ancien réglage isolé du taux de provision
    const ancien = localStorage.getItem("provisionPourcent");
    if (ancien !== null) {
      return borner({ ...REGLAGES_DEFAUT, provision: Number(ancien) });
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
