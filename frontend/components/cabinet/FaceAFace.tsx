"use client";

import { useState } from "react";
import { anneePersonnelle, moisPersonnel, MOT_DU_NOMBRE, COULEUR_DU_NOMBRE } from "@/lib/numerologie";

// FACE À FACE — au cabinet seulement (Elena, 16 octobre) : ses nombres à
// elle et ceux d'un proche, côte à côte, sur une année : l'année
// personnelle de chacun en tête, puis les douze mois (« en novembre, elle
// est en 7, lui en 5 »). Les flèches changent d'année ; les pastilles
// choisissent le proche.

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

type Personne = { prenom: string; dateNaissance: string | null; lien?: string };

function jm(date: string | null): { j: number; m: number } | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || "");
  return r ? { j: Number(r[3]), m: Number(r[2]) } : null;
}

function Pastille({ v, grand = false }: { v: number; grand?: boolean }) {
  const c = COULEUR_DU_NOMBRE[v] ?? COULEUR_DU_NOMBRE[v % 9 || 9] ?? { fond: "#FBF7F2", encre: "#232B45" };
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-serif font-bold ${grand ? "h-11 min-w-[2.75rem] px-2 text-[24px]" : "h-8 min-w-[2rem] px-1.5 text-[17px]"}`}
      style={{ backgroundColor: c.fond, color: c.encre }}
      title={MOT_DU_NOMBRE[v]}
    >
      {v}
    </span>
  );
}

export default function FaceAFace({ elle, proches }: { elle: Personne; proches: (Personne & { libelle: string })[] }) {
  const auj = new Date();
  const [annee, setAnnee] = useState(auj.getFullYear());
  const avecDate = proches.filter((p) => jm(p.dateNaissance));
  const [choix, setChoix] = useState(0);
  const lui = avecDate[choix] ?? avecDate[0];
  const a = jm(elle.dateNaissance);
  const b = lui ? jm(lui.dateNaissance) : null;
  if (!a || !lui || !b) return null;

  const apA = anneePersonnelle(a.j, a.m, annee);
  const apB = anneePersonnelle(b.j, b.m, annee);

  return (
    <section className="rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/[0.07] to-ivory p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-jakarta text-lg font-bold tracking-tight text-aubergine">Face à face</h2>
          <p className="mt-0.5 text-sm font-medium text-ink/70">Ses mois et ceux de l&apos;autre, côte à côte.</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setAnnee((x) => x - 1)} aria-label="Année précédente" className="h-8 w-8 rounded-full text-lg text-aubergine hover:bg-cream">‹</button>
          <span className="min-w-[3.5rem] text-center text-[15px] font-bold text-aubergine">{annee}</span>
          <button type="button" onClick={() => setAnnee((x) => x + 1)} aria-label="Année suivante" className="h-8 w-8 rounded-full text-lg text-aubergine hover:bg-cream">›</button>
        </div>
      </div>

      {avecDate.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {avecDate.map((p, i) => (
            <button
              key={`${p.prenom}-${i}`}
              type="button"
              onClick={() => setChoix(i)}
              aria-pressed={i === choix}
              className={`rounded-full px-3 py-1 text-[13px] font-semibold transition ${i === choix ? "bg-aubergine text-cream" : "border border-greige bg-white text-aubergine hover:border-gold"}`}
            >
              {p.libelle}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-y-1 text-[14px]">
          <thead>
            <tr className="text-left text-[12px] font-bold uppercase tracking-[0.08em] text-gold-dark">
              <th className="px-3 py-1 font-bold"></th>
              <th className="px-3 py-1 text-center font-bold">{elle.prenom}</th>
              <th className="px-3 py-1 text-center font-bold">{lui.prenom}</th>
            </tr>
          </thead>
          <tbody>
            {/* L'année complète, en tête */}
            <tr className="bg-white/90">
              <td className="rounded-l-xl px-3 py-2 font-bold text-ink">Année {annee}</td>
              <td className="px-3 py-2 text-center"><Pastille v={apA} grand /><span className="ml-2 align-middle text-[12px] font-medium text-ink/70">{MOT_DU_NOMBRE[apA]}</span></td>
              <td className="rounded-r-xl px-3 py-2 text-center"><Pastille v={apB} grand /><span className="ml-2 align-middle text-[12px] font-medium text-ink/70">{MOT_DU_NOMBRE[apB]}</span></td>
            </tr>
            {MOIS.map((nom, i) => {
              const mA = moisPersonnel(apA, i + 1);
              const mB = moisPersonnel(apB, i + 1);
              const maintenant = annee === auj.getFullYear() && i === auj.getMonth();
              return (
                <tr key={nom} className={maintenant ? "bg-[#FBF3E2]" : "bg-white/60"}>
                  <td className={`rounded-l-xl px-3 py-1.5 font-medium capitalize text-ink ${maintenant ? "font-bold" : ""}`}>
                    {nom}{maintenant && <span className="ml-1.5 text-[11px] font-semibold normal-case text-gold-dark">· ce mois-ci</span>}
                  </td>
                  <td className="px-3 py-1.5 text-center"><Pastille v={mA} /></td>
                  <td className="rounded-r-xl px-3 py-1.5 text-center"><Pastille v={mB} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
