"use client";

import { useState } from "react";
import { CITATION, INTRO, PREFERE, RAYONS } from "@/lib/bibliographie";

// MA BIBLIOTHÈQUE (Elena, 16 octobre) — les livres qui ont nourri son
// chemin, sa bibliographie de l'ancien site. Dans Apprendre, onglet
// « Apprendre en lisant » : la librairie, ce sont ses livres ; la
// bibliothèque, ceux qu'elle a lus et qu'elle recommande. Pas de lien
// marchand : ce sont des conseils de lecture, pas une vitrine.

export default function Bibliotheque() {
  const [rayon, setRayon] = useState<string>("tous");
  const visibles = RAYONS.filter((r) => rayon === "tous" || r.cle === rayon);
  const total = RAYONS.reduce((n, r) => n + r.livres.length, 0);

  return (
    <section>
      <header className="max-w-2xl">
        <h2 className="font-serif text-[30px] font-semibold leading-tight text-aubergine">Ma bibliothèque</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{INTRO}</p>
        <blockquote className="mt-4 rounded-[18px] border-l-4 border-gold/60 bg-[#FBF3E2] px-5 py-3 font-serif text-[17px] italic leading-relaxed text-ink">
          « {CITATION} » <span className="not-italic text-mention">— Elena</span>
        </blockquote>
      </header>

      {/* Son livre préféré, en tête */}
      <section className="mt-7 grid max-w-3xl items-start gap-6 rounded-[24px] bg-gradient-to-br from-[#FBE6EE] via-[#EFDDF3] to-[#DCD3F3] p-6 sm:grid-cols-[140px_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PREFERE.couverture}
          alt={`Couverture : ${PREFERE.titre}, ${PREFERE.auteur}`}
          className="mx-auto w-[140px] -rotate-2 rounded-r-lg rounded-l-sm shadow-[0_18px_30px_-16px_rgba(35,43,69,0.55)] ring-1 ring-black/10 sm:mx-0"
          loading="lazy"
        />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8E2E55]">♡ Mon livre préféré</p>
          <p className="mt-2 font-serif text-[26px] font-semibold leading-tight text-aubergine">{PREFERE.titre}</p>
          <p className="text-[14px] text-mention">{PREFERE.auteur} · {PREFERE.edition}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/90">{PREFERE.texte}</p>
        </div>
      </section>

      {/* Les rayons */}
      <nav aria-label="Rayons de la bibliothèque" className="mt-8 flex flex-wrap gap-1.5">
        {[["tous", `Tous les livres · ${total}`] as const, ...RAYONS.map((r) => [r.cle, r.nom] as const)].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setRayon(k)}
            aria-pressed={rayon === k}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${rayon === k ? "bg-aubergine text-cream shadow-card" : "border border-greige bg-white text-aubergine hover:border-gold"}`}
          >
            {l}
          </button>
        ))}
      </nav>

      <div className="mt-5 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibles.map((r) => (
          <section key={r.cle} className="rounded-[22px] border border-greige/60 bg-ivory p-5 shadow-soft">
            <h3 className="flex items-center gap-2.5 font-serif text-[21px] font-semibold text-aubergine">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF3E2] text-[17px] text-gold-dark">{r.signe}</span>
              {r.nom}
            </h3>
            {r.intro && <p className="mt-2 text-[13px] italic leading-snug text-mention">{r.intro}</p>}
            <ul className="mt-3 divide-y divide-greige/50">
              {r.livres.map((l) => (
                <li key={l.titre} className="py-2">
                  <p className="text-[14px] font-semibold leading-snug text-aubergine">
                    {l.titre}
                    {l.coeur && <span className="ml-1.5 text-[12px] text-gold-dark" title="Un de mes coups de cœur">★</span>}
                  </p>
                  <p className="text-[12.5px] text-mention">{l.auteur}</p>
                  {l.note && <p className="mt-0.5 text-[12px] italic text-ink/70">{l.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-6 text-[12px] text-mention"><span className="text-gold-dark">★</span> mes coups de cœur</p>
    </section>
  );
}
