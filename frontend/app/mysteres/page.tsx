"use client";

import EspaceShell from "@/components/EspaceShell";
import { Bientot } from "@/components/Ornements";

// LE CABINET DES MYSTÈRES (Elena, 16 octobre) — une partie très large : tous
// les mystères mystiques, les choses inexpliquées, les « et si… » qui
// bousculent notre regard sur la réalité. Pour l'instant, presque vide : la
// porte et la promesse. Le contenu viendra d'Elena (histoires vraies,
// lieux et objets inexpliqués, synchronicités).

export default function MysteresPage() {
  return (
    <EspaceShell>
      <header className="max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Avec Elena</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">Le cabinet des mystères</h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">Et si…</p>
      </header>

      <section className="relative mt-8 max-w-2xl overflow-hidden rounded-[28px] bg-gradient-to-br from-[#232B45] via-[#352E57] to-[#5B3F8C] px-6 py-8 text-cream shadow-card md:px-9">
        {[[8, 20, 1.5], [18, 78, 1], [34, 14, 2], [52, 82, 1], [66, 22, 1.5], [80, 70, 1], [92, 30, 2]].map(([x, y, r]) => (
          <span key={`${x}-${y}`} aria-hidden className="absolute rounded-full bg-[#F3E2B3]" style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, opacity: 0.55 }} />
        ))}
        <p className="relative font-serif text-[20px] leading-relaxed md:text-[22px]">
          Cette partie est très large : elle évoque tous les mystères mystiques.
        </p>
        <p className="relative mt-3 text-[15px] leading-relaxed text-cream/85">
          J&apos;y rassemble les choses mystérieuses, mystiques, inexpliquées — tous les « et si… » qui bousculent notre regard sur la
          réalité.
        </p>
      </section>

      <Bientot>Les premiers mystères arrivent bientôt</Bientot>
    </EspaceShell>
  );
}
