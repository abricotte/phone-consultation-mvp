// Formatages partagés du cabinet — regroupés ici pour que le même
// prénom s'affiche partout de la même façon.

/** « vigo » → « Vigo » · « marie-claire » → « Marie-Claire » */
/**
 * Deux numéros désignent-ils la même ligne ? Compare les chiffres seuls,
 * comme backend/src/utils/telephone.js : +33612345678, 0612345678 et
 * 0033612345678 sont le même numéro, et un blocage qui l'ignorerait ne
 * vaudrait rien face à quelqu'un de déterminé.
 */
export function memeNumero(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  const chiffres = (s: string) => s.replace(/\D/g, "").replace(/^(00|0)/, "");
  const ca = chiffres(a);
  const cb = chiffres(b);
  if (!ca || !cb) return false;
  // Un numéro français peut être rangé avec ou sans son indicatif : on
  // compare donc aussi par la fin (les 9 chiffres significatifs).
  return ca === cb || ca.endsWith(cb) || cb.endsWith(ca);
}

export function capitaliser(nom: string | null | undefined): string {
  if (!nom) return "";
  return nom
    .trim()
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[\s'’-])([\p{L}])/gu, (_, sep, lettre) => sep + lettre.toLocaleUpperCase("fr-FR"));
}

/** « aujourd'hui », « hier », « il y a 3 semaines », « il y a 8 mois » */
export function depuisQuand(iso: string | null | undefined): string {
  if (!iso) return "";
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} jours`;
  if (jours < 31) {
    const s = Math.round(jours / 7);
    return `il y a ${s} semaine${s > 1 ? "s" : ""}`;
  }
  const m = Math.round(jours / 30);
  if (m < 12) return `il y a ${m} mois`;
  const a = Math.floor(m / 12);
  return `il y a ${a} an${a > 1 ? "s" : ""}`;
}

/** Nombre de jours écoulés depuis une date, ou null */
export function joursDepuis(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/** « 12 mars 2026 » */
export function dateLongue(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Trie des échéances : les plus proches d'abord, les floues en fin */
export function comparerEcheances(
  a: { echeance?: string | null },
  b: { echeance?: string | null }
): number {
  if (a.echeance && b.echeance) return a.echeance < b.echeance ? -1 : 1;
  if (a.echeance) return -1; // une date précise passe devant un « vers octobre »
  if (b.echeance) return 1;
  return 0;
}

/** Une échéance est-elle proche (moins de 30 jours) ou dépassée ? */
export function echeanceProche(echeance: string | null | undefined): boolean {
  if (!echeance) return false;
  const j = Math.round(
    (new Date(echeance + "T00:00:00").getTime() - Date.now()) / 86400000
  );
  return j <= 30;
}
