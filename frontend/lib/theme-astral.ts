// LE THÈME ASTRAL — le calcul. Positions réelles par la bibliothèque
// d'éphémérides astronomy-engine (MIT) ; zodiaque tropical (écliptique
// vraie de date) ; maisons en signes entiers ; sept planètes
// traditionnelles, les modernes à part ; secte, dignités essentielles
// majeures, aspects par signe entier avec l'orbe exact, lots de Fortune et
// d'Esprit selon la secte, profection annuelle. Sans heure connue : les
// planètes en signes seulement, ni ascendant ni maisons — on n'invente
// pas (document d'Elena, « Méthode complète de lecture », étape 1).

import * as A from "astronomy-engine";
import { PLANETES, SIGNES, type ClePlanete, type CleModerne } from "@/lib/astro-savoirs";

export type EntreeTheme = {
  dateNaissance: string; // YYYY-MM-DD
  heureNaissance?: string | null; // HH:MM, heure locale du lieu
  latitude?: number | null;
  longitude?: number | null;
  fuseau?: string | null; // IANA, ex. Europe/Paris
};

export type Dignite = "domicile" | "exaltation" | "exil" | "chute" | "peregrine";
export type EtatSolaire = "cazimi" | "combuste" | "sous les rayons" | null;

export type Astre = {
  cle: ClePlanete | CleModerne | "noeud_nord" | "noeud_sud";
  nom: string;
  glyphe: string;
  lon: number;
  signe: number; // 0 = Bélier
  degre: number; // 0–29
  minute: number;
  retro: boolean;
  maison: number | null; // 1–12, signes entiers
  dignite: Dignite | null;
  etatSolaire: EtatSolaire;
};

export type Aspect = { a: ClePlanete; b: ClePlanete; type: "conjonction" | "sextile" | "carre" | "trigone" | "opposition"; orbe: number; serre: boolean };

export type Theme = {
  utc: Date;
  heureConnue: boolean;
  lieuConnu: boolean;
  asc: number | null;
  mc: number | null;
  secte: "diurne" | "nocturne" | null;
  planetes: Astre[]; // les sept, dans l'ordre traditionnel
  modernes: Astre[];
  noeuds: Astre[];
  aspects: Aspect[];
  lots: { fortune: number; esprit: number } | null;
  profection: { age: number; maison: number; signe: number; maitre: ClePlanete } | null;
  maitreAscendant: ClePlanete | null;
};

const ORDRE: ClePlanete[] = ["soleil", "lune", "mercure", "venus", "mars", "jupiter", "saturne"];
const CORPS: Record<ClePlanete | CleModerne, A.Body> = {
  soleil: A.Body.Sun, lune: A.Body.Moon, mercure: A.Body.Mercury, venus: A.Body.Venus, mars: A.Body.Mars,
  jupiter: A.Body.Jupiter, saturne: A.Body.Saturn, uranus: A.Body.Uranus, neptune: A.Body.Neptune, pluton: A.Body.Pluto,
};
const MOD: Record<CleModerne, { nom: string; glyphe: string }> = { uranus: { nom: "Uranus", glyphe: "♅" }, neptune: { nom: "Neptune", glyphe: "♆" }, pluton: { nom: "Pluton", glyphe: "♇" } };

const norm = (d: number) => ((d % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
/** Écart signé entre deux longitudes, dans (−180, 180] */
const ecart = (a: number, b: number) => ((b - a + 540) % 360) - 180;

// ── Heure locale → UTC, par le fuseau IANA (gère l'heure d'été historique via Intl)
function decalageMinutes(utcMs: number, fuseau: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: fuseau, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p: Record<string, string> = {};
  for (const x of dtf.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  const commeUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return (commeUtc - utcMs) / 60000;
}
export function versUtc(date: string, heure: string, fuseau: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = heure.split(":").map(Number);
  const localCommeUtc = Date.UTC(y, m - 1, d, h, mi);
  let utc = localCommeUtc - decalageMinutes(localCommeUtc, fuseau) * 60000;
  utc = localCommeUtc - decalageMinutes(utc, fuseau) * 60000;
  return new Date(utc);
}

// ── Longitude écliptique géocentrique, équinoxe vrai de date (zodiaque tropical)
function longitude(body: A.Body, t: A.AstroTime): number {
  if (body === A.Body.Sun) return norm(A.SunPosition(t).elon);
  const v = A.GeoVector(body, t, true);
  return norm(A.SphereFromVector(A.RotateVector(A.Rotation_EQJ_ECT(t), v)).lon);
}
function retrograde(body: A.Body, t: A.AstroTime): boolean {
  if (body === A.Body.Sun || body === A.Body.Moon) return false;
  const t2 = A.MakeTime(new Date(t.date.getTime() + 86400000));
  return ecart(longitude(body, t), longitude(body, t2)) < 0;
}
// Nœud lunaire moyen (formule classique)
function noeudMoyen(t: A.AstroTime): number {
  const T = t.tt / 36525;
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
}

// ── Un point de l'écliptique vraie de date → sa hauteur sur l'horizon du lieu
function horizonEcliptique(lon: number, t: A.AstroTime, obs: A.Observer, eps: number) {
  const l = rad(lon), e = rad(eps);
  const ra = norm(deg(Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l)))) / 15; // heures
  const dec = deg(Math.asin(Math.sin(l) * Math.sin(e)));
  return A.Horizon(t, obs, ra, dec, "normal");
}
// L'ascendant : le point de l'écliptique qui se lève à l'est. Balayage puis bissection.
function ascendant(t: A.AstroTime, obs: A.Observer, eps: number): number {
  const alt = (l: number) => horizonEcliptique(l, t, obs, eps);
  let prev = alt(0);
  for (let l = 2; l <= 360; l += 2) {
    const cur = alt(l);
    if (prev.altitude > 0 && cur.altitude <= 0 && cur.azimuth < 180) {
      let lo = l - 2, hi = l;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (alt(mid).altitude > 0) lo = mid; else hi = mid;
      }
      return norm((lo + hi) / 2);
    }
    prev = cur;
  }
  // Latitudes extrêmes : on renvoie le point d'altitude maximale à l'est
  return norm(alt(0).altitude > 0 ? 0 : 180);
}
// Le milieu du ciel : l'écliptique à l'ascension droite du méridien, côté visible.
function milieuDuCiel(t: A.AstroTime, obs: A.Observer, eps: number): number {
  const theta = rad(norm(A.SiderealTime(t) * 15 + obs.longitude));
  const l1 = norm(deg(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(rad(eps)))));
  const l2 = norm(l1 + 180);
  return horizonEcliptique(l1, t, obs, eps).altitude >= horizonEcliptique(l2, t, obs, eps).altitude ? l1 : l2;
}

function dignite(cle: ClePlanete, signe: number): Dignite {
  const p = PLANETES[cle];
  if (p.domiciles.includes(signe)) return "domicile";
  if (p.exaltation === signe) return "exaltation";
  if (p.domiciles.some((d) => (d + 6) % 12 === signe)) return "exil";
  if ((p.exaltation + 6) % 12 === signe) return "chute";
  return "peregrine";
}
function etatSolaire(cle: string, lon: number, lonSoleil: number): EtatSolaire {
  if (cle === "soleil") return null;
  const d = Math.abs(ecart(lon, lonSoleil));
  if (d <= 17 / 60) return "cazimi";
  if (d <= 8.5) return "combuste";
  if (d <= 17) return "sous les rayons";
  return null;
}

function astre(cle: Astre["cle"], nom: string, glyphe: string, lon: number, retro: boolean, ascSigne: number | null, lonSoleil: number, trad: boolean): Astre {
  const signe = Math.floor(lon / 30);
  const dansSigne = lon - signe * 30;
  return {
    cle, nom, glyphe, lon, signe,
    degre: Math.floor(dansSigne), minute: Math.floor((dansSigne % 1) * 60), retro,
    maison: ascSigne === null ? null : ((signe - ascSigne + 12) % 12) + 1,
    dignite: trad ? dignite(cle as ClePlanete, signe) : null,
    etatSolaire: trad ? etatSolaire(cle, lon, lonSoleil) : null,
  };
}

export function calculerTheme(e: EntreeTheme, aujourdHui = new Date()): Theme {
  const heureConnue = !!e.heureNaissance;
  const lieuConnu = typeof e.latitude === "number" && typeof e.longitude === "number" && !!e.fuseau;
  const fuseau = e.fuseau || "Europe/Paris";
  // Sans heure : midi local, et l'on ne calcule ni ascendant ni maisons.
  const utc = versUtc(e.dateNaissance, e.heureNaissance || "12:00", fuseau);
  const t = A.MakeTime(utc);
  const eps = A.e_tilt(t).tobl;

  let asc: number | null = null, mc: number | null = null, secte: Theme["secte"] = null;
  const lonSoleil = longitude(A.Body.Sun, t);
  if (heureConnue && lieuConnu) {
    const obs = new A.Observer(e.latitude as number, e.longitude as number, 0);
    asc = ascendant(t, obs, eps);
    mc = milieuDuCiel(t, obs, eps);
    const eq = A.Equator(A.Body.Sun, t, obs, true, true);
    secte = A.Horizon(t, obs, eq.ra, eq.dec, "normal").altitude > 0 ? "diurne" : "nocturne";
  }
  const ascSigne = asc === null ? null : Math.floor(asc / 30);

  const planetes = ORDRE.map((cle) => astre(cle, PLANETES[cle].nom, PLANETES[cle].glyphe, longitude(CORPS[cle], t), retrograde(CORPS[cle], t), ascSigne, lonSoleil, true));
  const modernes = (["uranus", "neptune", "pluton"] as CleModerne[]).map((cle) => astre(cle, MOD[cle].nom, MOD[cle].glyphe, longitude(CORPS[cle], t), retrograde(CORPS[cle], t), ascSigne, lonSoleil, false));
  const nn = noeudMoyen(t);
  const noeuds = [astre("noeud_nord", "Nœud nord", "☊", nn, true, ascSigne, lonSoleil, false), astre("noeud_sud", "Nœud sud", "☋", norm(nn + 180), true, ascSigne, lonSoleil, false)];

  // Aspects par signe entier, avec l'orbe exact ; « serré » : 8°, 10° avec un luminaire
  const TYPES: Record<number, Aspect["type"]> = { 0: "conjonction", 2: "sextile", 3: "carre", 4: "trigone", 6: "opposition" };
  const ANGLES: Record<Aspect["type"], number> = { conjonction: 0, sextile: 60, carre: 90, trigone: 120, opposition: 180 };
  const aspects: Aspect[] = [];
  for (let i = 0; i < planetes.length; i++) for (let j = i + 1; j < planetes.length; j++) {
    const p = planetes[i], q = planetes[j];
    const d = (q.signe - p.signe + 12) % 12;
    const type = TYPES[Math.min(d, 12 - d)];
    if (!type) continue;
    const orbe = Math.abs(Math.abs(ecart(p.lon, q.lon)) - ANGLES[type]);
    const lum = p.cle === "soleil" || p.cle === "lune" || q.cle === "soleil" || q.cle === "lune";
    aspects.push({ a: p.cle as ClePlanete, b: q.cle as ClePlanete, type, orbe: Math.round(orbe * 10) / 10, serre: orbe <= (lum ? 10 : 8) });
  }
  aspects.sort((x, y) => Number(y.serre) - Number(x.serre) || x.orbe - y.orbe);

  let lots: Theme["lots"] = null, profection: Theme["profection"] = null, maitreAscendant: ClePlanete | null = null;
  if (asc !== null && ascSigne !== null && secte) {
    const s = planetes[0].lon, l = planetes[1].lon;
    lots = secte === "diurne" ? { fortune: norm(asc + l - s), esprit: norm(asc + s - l) } : { fortune: norm(asc + s - l), esprit: norm(asc + l - s) };
    const [y, m, d] = e.dateNaissance.split("-").map(Number);
    let age = aujourdHui.getFullYear() - y;
    if (aujourdHui.getMonth() + 1 < m || (aujourdHui.getMonth() + 1 === m && aujourdHui.getDate() < d)) age -= 1;
    const signe = (ascSigne + (age % 12)) % 12;
    profection = { age, maison: (age % 12) + 1, signe, maitre: SIGNES[signe].maitre };
    maitreAscendant = SIGNES[ascSigne].maitre;
  }

  return { utc, heureConnue, lieuConnu, asc, mc, secte, planetes, modernes, noeuds, aspects, lots, profection, maitreAscendant };
}

/** « 18° 42′ Scorpion » */
export function libellePosition(lon: number): string {
  const s = Math.floor(norm(lon) / 30), d = norm(lon) - s * 30;
  return `${Math.floor(d)}° ${String(Math.floor((d % 1) * 60)).padStart(2, "0")}′ ${SIGNES[s].nom}`;
}
