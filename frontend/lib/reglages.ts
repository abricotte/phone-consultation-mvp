// Réglages de pilotage de la praticienne (taux fiscaux, seuils).
//
// Ils étaient conservés dans le localStorage. Conséquence observée : le
// défaut URSSAF est passé à 26 % dans le code, mais un navigateur qui avait
// mémorisé l'ancien 23 % continuait de l'afficher — le « net estimé » était
// optimiste de 3 points sans que rien ne le signale. Ils vivent désormais
// en base, et suivent Elena d'une machine à l'autre.

import { api } from "@/lib/api";

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
function borner(r: Partial<Reglages> | null | undefined): Reglages {
  r = r ?? {};
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

// Dernier état connu du serveur, partagé par toutes les pages du cabinet.
// Évite que Revenus et Clientes calculent avec des taux différents le temps
// que chacune interroge l'API de son côté.
let cache: Reglages | null = null;

/** Valeur immédiate pour l'état initial d'un composant, sans attente. */
export function chargerReglages(): Reglages {
  return cache ?? REGLAGES_DEFAUT;
}

/** Va chercher les réglages en base. À appeler au montage d'une page. */
export async function rafraichirReglages(): Promise<Reglages> {
  const p = await api.adminGetProfil();
  cache = borner((p as { reglages?: Partial<Reglages> }).reglages);
  return cache;
}

/** Enregistre en base et met le cache à jour. */
export async function enregistrerReglages(
  r: Partial<Reglages>
): Promise<Reglages> {
  const res = (await api.adminPatchReglages(r)) as { reglages: Reglages };
  cache = borner(res.reglages);
  return cache;
}

/**
 * Réglages restés dans CE navigateur, s'il y en a — à remonter une seule
 * fois vers le serveur. C'est ainsi qu'un URSSAF à 23 % mémorisé ici avant
 * que le défaut ne passe à 26 % cesse enfin de fausser le net affiché.
 *
 * @returns null s'il n'y a rien à reprendre
 */
export function lireReglagesLocaux(): Reglages | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return borner(JSON.parse(brut));

    const ancien = localStorage.getItem("provisionPourcent");
    if (ancien !== null) {
      return borner({ ...REGLAGES_DEFAUT, urssaf: Number(ancien) });
    }
  } catch {
    /* réglages illisibles : rien à reprendre */
  }
  return null;
}

/** Une fois les réglages en base, la copie locale ne doit plus dériver. */
export function oublierReglagesLocaux(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CLE);
    localStorage.removeItem("provisionPourcent");
  } catch {
    /* sans importance : la base fait foi désormais */
  }
}
