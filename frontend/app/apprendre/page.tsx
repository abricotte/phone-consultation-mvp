"use client";

import { useState } from "react";
import EspaceShell from "@/components/EspaceShell";
import { Pilules, Bientot } from "@/components/Ornements";

// APPRENDRE — ce qu'Elena sait des cartes, elle l'apprend. Le podcast sur
// le Lenormand (La Minute Voyance, lecteur Spotify : rien à héberger) et
// les vidéos à venir. « Se former » reste possible si Elena vise un vrai
// cursus — à trancher.

export default function ApprendrePage() {
  const [onglet, setOnglet] = useState<"podcast" | "videos">("podcast");

  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Apprendre
        </h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Ce que je sais des cartes, je vous l&apos;apprends — à votre rythme, sans prérequis.
        </p>
      </header>

      <Pilules
        label="Apprendre"
        valeur={onglet}
        onChange={setOnglet}
        options={[["podcast", "Le podcast"], ["videos", "Les vidéos"]] as const}
      />

      {onglet === "podcast" && (
        <section>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
            Le podcast · le Lenormand
          </p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">La Minute Voyance</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/85">
            Une carte, une minute, une clé. Les 36 cartes de Mademoiselle Lenormand, une par épisode — pour
            apprendre à les lire comme je les lis. Ici, et sur Spotify partout ailleurs.
          </p>
          <div className="mt-4 overflow-hidden rounded-[20px]">
            <iframe
              title="La Minute Voyance sur Spotify"
              src="https://open.spotify.com/embed/show/19rxAXVwo3fTG1RJAV7Y4R?utm_source=generator&theme=0"
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        </section>
      )}

      {onglet === "videos" && (
        <section className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Les vidéos</p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Se former à la voyance</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/85">
            Des leçons courtes, filmées, pour lire le Lenormand et écouter ce que vous percevez. Les premières
            sont en préparation ; elles arriveront ici, dans votre espace.
          </p>
          <Bientot>Les premières leçons, bientôt</Bientot>
        </section>
      )}
    </EspaceShell>
  );
}
