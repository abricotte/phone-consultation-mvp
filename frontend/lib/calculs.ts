// Calcul de la cascade « encaissé → net » — SOURCE UNIQUE.
// Utilisée par l'onglet Revenus et par la page d'accueil du cabinet :
// les deux doivent toujours annoncer le même net, sans quoi la
// praticienne ne saurait plus lequel croire.

import type { Reglages } from "@/lib/reglages";

// Frais Stripe (cartes européennes) : 1,5 % + 0,25 € par transaction.
export const STRIPE_TAUX = 0.015;
export const STRIPE_FIXE = 0.25;
// Twilio : ~0,03 €/min pour les DEUX jambes de l'appel.
export const TWILIO_MINUTE = 0.03;

export interface EntreesCascade {
  /** Encaissé TTC sur la période (consultations facturées) */
  encaisseTTC: number;
  /** Montant des recharges de la période (assiette des frais Stripe) */
  montantRecharges: number;
  /** Nombre de recharges (les frais Stripe ont une part fixe) */
  nbRecharges: number;
  /** Minutes de communication réelles (assiette des frais Twilio) */
  minutes: number;
  /** Coûts fixes à imputer sur la période (0 pour une journée) */
  coutsFixes?: number;
}

export interface Cascade {
  encaisseTTC: number;
  tvaCollectee: number;
  encaisseHT: number;
  fraisStripe: number;
  fraisTwilio: number;
  coutsFixes: number;
  urssaf: number;
  impot: number;
  net: number;
}

/**
 * La TVA collectée n'appartient pas à la praticienne : elle sort avant
 * tout le reste, et les cotisations se calculent sur le CA HT.
 *
 * `prixTTC` dit comment lire les tarifs affichés :
 *  — TTC (défaut) : 2,90 € est ce que la cliente paie. La TVA est DEDANS,
 *    on la retire → 2,42 € HT.
 *  — HT : 2,90 € est le revenu avant TVA. La cliente paie 3,48 €, et la
 *    TVA s'AJOUTE au montant encaissé.
 * Se tromper de convention fausse le net d'un cinquième : d'où le choix
 * explicite sur la page Profil plutôt qu'une hypothèse silencieuse.
 */
export function calculerCascade(
  e: EntreesCascade,
  r: Reglages,
  prixTTC: boolean = true
): Cascade {
  const taux = r.tvaActive ? r.tvaTaux / 100 : 0;

  // Montant réellement encaissé auprès des clientes, toutes taxes comprises.
  const encaisseTTC = prixTTC ? e.encaisseTTC : e.encaisseTTC * (1 + taux);
  const tvaCollectee = r.tvaActive ? encaisseTTC - encaisseTTC / (1 + taux) : 0;
  const encaisseHT = encaisseTTC - tvaCollectee;

  const fraisStripe = e.montantRecharges * STRIPE_TAUX + e.nbRecharges * STRIPE_FIXE;
  const fraisTwilio = e.minutes * TWILIO_MINUTE;
  const coutsFixes = e.coutsFixes ?? 0;

  const urssaf = (encaisseHT * r.urssaf) / 100;
  const impot = (encaisseHT * r.impot) / 100;

  return {
    encaisseTTC,
    tvaCollectee,
    encaisseHT,
    fraisStripe,
    fraisTwilio,
    coutsFixes,
    urssaf,
    impot,
    net: encaisseHT - fraisStripe - fraisTwilio - coutsFixes - urssaf - impot,
  };
}
