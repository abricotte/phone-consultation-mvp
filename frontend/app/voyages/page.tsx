"use client";

import EspaceShell from "@/components/EspaceShell";
import { Bientot } from "@/components/Ornements";

// VOYAGES SPIRITUELS — à venir en 2027. Une page qui ne vend rien encore :
// une promesse, deux images (Delphes et Délos, où les cartes ont été
// consacrées). Les dates et les places viendront ici quand elles seront
// sûres — jamais avant.

export default function VoyagesPage() {
  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Voyages spirituels
        </h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Un jour, on partira ensemble là où les cartes ont été consacrées.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {[
          ["/images/voyages/delphes.webp", "Delphes", "le temple d'Apollon, où la Pythie répondait"],
          ["/images/voyages/delos.webp", "Délos", "l'île de la lumière, le temple d'Isis"],
        ].map(([src, t, d]) => (
          <figure key={t} className="group relative overflow-hidden rounded-[28px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-aubergine/80 to-transparent px-6 pb-5 pt-16 text-cream">
              <span className="block font-serif text-3xl font-semibold">{t}</span>
              <span className="text-[13px] text-cream/85">{d}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="mt-8 max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">À venir · 2027</p>
        <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Quelques jours, en petit groupe</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
          Un premier voyage se prépare pour 2027 : la Grèce, Delphes et Délos, quelques jours en petit cercle
          — marcher, tirer les cartes là où elles ont été consacrées, et consulter autrement. Les dates, le
          nombre de places et le programme viendront ici, dans votre espace, quand ils seront sûrs.
        </p>
        <Bientot>Les dates et les places, quand elles seront sûres</Bientot>
      </section>
    </EspaceShell>
  );
}
