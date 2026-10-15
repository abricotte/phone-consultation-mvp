// MA JOURNÉE — le moteur. Un petit paragraphe chaque jour, assemblé
// (jamais généré) à partir de trois couches :
//   1. la tonalité du jour — un calcul sur la date de naissance qui ne se
//      montre jamais : c'est lui qui choisit l'ouverture ;
//   2. le ciel du jour, dit à voix haute — la Lune dans son signe, sa
//      phase, Vénus ou Mercure quand ils reculent — calculé par les
//      éphémérides (astronomy-engine) ;
//   3. un dernier mot pour son signe solaire.
// Même jour, même texte : Elena peut tout relire. Rien n'est stocké.

import * as A from "astronomy-engine";
import { anneePersonnelle, moisPersonnel } from "@/lib/numerologie";
import { LUNES, PHASES, RETROGRADES, SIGNES_MOT, TONALITES } from "@/lib/journee-textes";
import { signeAstrologique } from "@/lib/astro";

const SIGNES = ["Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge", "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"];
const GLYPHES = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const norm = (d: number) => ((d % 360) + 360) % 360;
const reduireSimple = (n: number) => { while (n > 9) n = String(n).split("").reduce((a, b) => a + Number(b), 0); return n; };

function longitude(body: A.Body, t: A.AstroTime): number {
  if (body === A.Body.Sun) return norm(A.SunPosition(t).elon);
  return norm(A.SphereFromVector(A.RotateVector(A.Rotation_EQJ_ECT(t), A.GeoVector(body, t, true))).lon);
}
function recule(body: A.Body, t: A.AstroTime): boolean {
  const t2 = A.MakeTime(new Date(t.date.getTime() + 86400000));
  const d = ((longitude(body, t2) - longitude(body, t) + 540) % 360) - 180;
  return d < 0;
}

/** Le jour personnel (1–9) : mois personnel + jour civil, réduit. Jamais affiché côté cliente. */
export function jourPersonnel(dateNaissance: string, aujourdHui = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateNaissance);
  if (!m) return null;
  const ap = anneePersonnelle(Number(m[3]), Number(m[2]), aujourdHui.getFullYear());
  const mp = moisPersonnel(ap, aujourdHui.getMonth() + 1);
  return reduireSimple(reduireSimple(mp) + aujourdHui.getDate());
}

export type Journee = {
  date: Date;
  lune: { signe: string; glyphe: string; phase: "nouvelle" | "pleine" | "croissante" | "décroissante" };
  venusRetro: boolean;
  mercureRetro: boolean;
  signe: string | null;
  /** Le paragraphe, dans l'ordre : tonalité · Lune · phase · rétrogrades · signe */
  phrases: string[];
};

export function calculerJournee(dateNaissance: string, aujourdHui = new Date()): Journee | null {
  const ton = jourPersonnel(dateNaissance, aujourdHui);
  if (!ton) return null;
  // Le ciel à midi, heure de Paris : la journée de la cliente, pas la minute.
  const midi = new Date(Date.UTC(aujourdHui.getFullYear(), aujourdHui.getMonth(), aujourdHui.getDate(), 11, 0));
  const t = A.MakeTime(midi);
  const lonLune = longitude(A.Body.Moon, t);
  const idxLune = Math.floor(lonLune / 30);
  const angle = A.MoonPhase(t); // 0 nouvelle · 180 pleine
  const phase: Journee["lune"]["phase"] = angle < 12 || angle > 348 ? "nouvelle" : Math.abs(angle - 180) < 12 ? "pleine" : angle < 180 ? "croissante" : "décroissante";
  const venusRetro = recule(A.Body.Venus, t);
  const mercureRetro = recule(A.Body.Mercury, t);
  const signe = signeAstrologique(dateNaissance)?.nom ?? null;

  const phrases = [TONALITES[ton], LUNES[idxLune]];
  if (phase === "nouvelle") phrases.push(PHASES.nouvelle);
  if (phase === "pleine") phrases.push(PHASES.pleine);
  if (venusRetro) phrases.push(RETROGRADES.venus);
  if (mercureRetro) phrases.push(venusRetro ? RETROGRADES.mercure : RETROGRADES.mercure.replace("Mercure rétrograde, aussi :", "Mercure est rétrograde :"));
  if (signe) phrases.push(SIGNES_MOT[SIGNES.indexOf(signe)]);

  return { date: aujourdHui, lune: { signe: SIGNES[idxLune], glyphe: GLYPHES[idxLune], phase }, venusRetro, mercureRetro, signe, phrases };
}
