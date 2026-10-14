"use client";

import { useMemo, useState } from "react";

// MOTS CACHÉS — le jeu du Carnet rose (L'Amour karmique), porté dans le
// salon. Les 25 mots viennent du carnet ; la grille est tirée avec un
// générateur déterministe (même graine → même grille, donc pas d'écart
// entre serveur et navigateur). « Nouvelle grille » change la graine.
// On clique la première lettre, puis la dernière : si la ligne droite
// épelle un mot (dans un sens ou l'autre), il est trouvé.

export const MOTS_CARNET_ROSE = [
  "KARMA", "KARMIQUE", "FLAMME", "MIROIR", "COMPAGNON",
  "AME", "LIEN", "CYCLE", "ABANDON", "TRAHISON",
  "SACRIFICE", "POUVOIR", "LUCIDITE", "LIBERATION", "PARDON",
  "DEPENDANCE", "AUTONOMIE", "SYNCHRONICITE", "REUNION", "BLESSURE",
  "VALEUR", "LIMITES", "LECON", "PATTERN", "SOUVERAINETE",
];

const TAILLE = 16;
const DIRS: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Placement = { mot: string; cases: [number, number][] };

function construire(mots: string[], graine: number): { grille: string[][]; places: Placement[] } {
  const alea = mulberry32(graine);
  const grille: string[][] = Array.from({ length: TAILLE }, () => Array(TAILLE).fill(""));
  const places: Placement[] = [];
  const tries = [...mots].sort((a, b) => b.length - a.length);
  for (const mot of tries) {
    let pose = false;
    for (let essai = 0; essai < 400 && !pose; essai++) {
      const [dr, dc] = DIRS[Math.floor(alea() * DIRS.length)];
      const r = Math.floor(alea() * TAILLE);
      const c = Math.floor(alea() * TAILLE);
      let ok = true;
      for (let i = 0; i < mot.length; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= TAILLE || nc < 0 || nc >= TAILLE || (grille[nr][nc] !== "" && grille[nr][nc] !== mot[i])) { ok = false; break; }
      }
      if (!ok) continue;
      const cases: [number, number][] = [];
      for (let i = 0; i < mot.length; i++) { grille[r + dr * i][c + dc * i] = mot[i]; cases.push([r + dr * i, c + dc * i]); }
      places.push({ mot, cases });
      pose = true;
    }
  }
  for (let r = 0; r < TAILLE; r++) for (let c = 0; c < TAILLE; c++) if (grille[r][c] === "") grille[r][c] = ALPHA[Math.floor(alea() * 26)];
  return { grille, places };
}

function ligne(a: [number, number], b: [number, number]): [number, number][] | null {
  const dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]);
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  if (dr !== 0 && dc !== 0 && Math.abs(b[0] - a[0]) !== Math.abs(b[1] - a[1])) return null;
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) out.push([a[0] + dr * i, a[1] + dc * i]);
  return out;
}

export default function MotsCaches({ mots = MOTS_CARNET_ROSE, titre = "Mots cachés · L'Amour karmique" }: { mots?: string[]; titre?: string }) {
  const [graine, setGraine] = useState(7);
  const [depart, setDepart] = useState<[number, number] | null>(null);
  const [trouves, setTrouves] = useState<Set<string>>(new Set());
  const [casesTrouvees, setCasesTrouvees] = useState<Set<string>>(new Set());
  const { grille, places } = useMemo(() => construire(mots, graine), [mots, graine]);
  const poses = places.map((p) => p.mot);

  function clic(r: number, c: number) {
    if (!depart) { setDepart([r, c]); return; }
    const chemin = ligne(depart, [r, c]);
    setDepart(null);
    if (!chemin) return;
    const texte = chemin.map(([a, b]) => grille[a][b]).join("");
    const inverse = texte.split("").reverse().join("");
    const mot = poses.find((m) => m === texte || m === inverse);
    if (!mot || trouves.has(mot)) return;
    setTrouves((t) => new Set(t).add(mot));
    setCasesTrouvees((s) => { const n = new Set(s); chemin.forEach(([a, b]) => n.add(`${a}-${b}`)); return n; });
  }

  function nouvelle() {
    setGraine((g) => g + 1); setDepart(null); setTrouves(new Set()); setCasesTrouvees(new Set());
  }

  const fini = trouves.size === poses.length;

  return (
    <div className="rounded-[24px] border border-[#EAD6DF] bg-[#F8EDF2] p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Le Carnet rose</p>
          <h3 className="mt-1 font-serif text-[26px] font-semibold leading-tight text-aubergine">{titre}</h3>
          <p className="mt-1 text-[13px] text-mention">
            Cliquez la première lettre, puis la dernière. Dans un sens ou dans l&apos;autre, droit ou en diagonale.
          </p>
        </div>
        <p className="text-[14px] text-ink">
          Trouvés : <span className="font-serif text-[22px] font-semibold tabular-nums text-aubergine">{trouves.size}</span>
          <span className="text-mention"> / {poses.length}</span>
        </p>
      </div>

      <div
        role="grid"
        aria-label="Grille de mots cachés"
        className="mx-auto mt-4 grid w-full max-w-[520px] select-none gap-px rounded-[14px] bg-white/70 p-1.5 ring-1 ring-white/80"
        style={{ gridTemplateColumns: `repeat(${TAILLE}, minmax(0, 1fr))` }}
      >
        {grille.map((rang, r) =>
          rang.map((lettre, c) => {
            const cle = `${r}-${c}`;
            const trouvee = casesTrouvees.has(cle);
            const choisie = depart && depart[0] === r && depart[1] === c;
            return (
              <button
                key={cle}
                type="button"
                role="gridcell"
                onClick={() => clic(r, c)}
                className={`aspect-square rounded-[4px] text-[12px] font-semibold leading-none transition sm:text-[13px] ${
                  trouvee ? "bg-[#F3CFDD] text-[#8E2E55]" : choisie ? "bg-aubergine text-cream" : "bg-transparent text-ink hover:bg-blush"
                }`}
              >
                {lettre}
              </button>
            );
          })
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {poses.map((m) => (
          <li
            key={m}
            className={`rounded-full px-2.5 py-1 text-[12px] ring-1 ${
              trouves.has(m) ? "bg-[#F3CFDD] text-[#8E2E55] line-through ring-[#E4B3C6]" : "bg-white/70 text-ink/80 ring-greige/60"
            }`}
          >
            {m.charAt(0) + m.slice(1).toLowerCase()}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {fini && (
          <p className="text-[14px] font-semibold text-aubergine">
            <span className="mr-1.5 text-gold">✦</span>Tout est trouvé. Bravo.
          </p>
        )}
        <button type="button" onClick={nouvelle} className="rounded-full border border-greige bg-white px-4 py-2 text-[13px] font-semibold text-aubergine hover:border-gold">
          Nouvelle grille
        </button>
        {depart && <button type="button" onClick={() => setDepart(null)} className="text-[13px] text-mention hover:underline">Annuler la sélection</button>}
      </div>
    </div>
  );
}
