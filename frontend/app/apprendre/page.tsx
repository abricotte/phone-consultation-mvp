"use client";

import { useState } from "react";
import EspaceShell from "@/components/EspaceShell";
import MotsCaches from "@/components/MotsCaches";
import { Pilules } from "@/components/Ornements";

// APPRENDRE — ce qu'Elena sait des cartes, elle l'apprend. Deux onglets
// (Elena, 15 octobre) : « Apprendre en écoutant » (le podcast La Minute
// Voyance, lecteur Spotify : rien à héberger) et « Apprendre en
// s'amusant » (la série de livres-jeux « Les jeux d'Elena », et les mots
// cachés du Carnet rose, jouables ici). Les vidéos viendront quand Elena
// les aura commencées — on n'ouvre pas une pièce vide.

export default function ApprendrePage() {
  const [onglet, setOnglet] = useState<"ecouter" | "jouer">("ecouter");

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
        options={[["ecouter", "Apprendre en écoutant"], ["jouer", "Apprendre en s'amusant"]] as const}
      />

      {onglet === "ecouter" && (
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
          <p className="mt-3 text-[13px] text-mention">
            Pour aller plus loin que la minute :{" "}
            <a href="/salon" className="font-semibold text-prix hover:underline">
              mes carnets et mes livres
            </a>
            , dans le salon.
          </p>
        </section>
      )}

      {onglet === "jouer" && (
        <>
          {/* Les jeux d'Elena — la série de livres-jeux. En révision chez
              Amazon : pas de lien tant qu'il n'est pas en ligne. */}
          <section>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Les jeux d&apos;Elena · le Tarot de Marseille</p>
            <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Le livre-jeu</h2>
            <div className="mt-5 grid items-start gap-6 sm:grid-cols-[180px_1fr]">
              {/* La couverture : un aplat en attendant la vraie */}
              <div className="aspect-[2/3] w-[180px] rounded-r-xl rounded-l-sm bg-gradient-to-br from-[#1E2A4A] to-[#2E3F6B] p-4 shadow-[0_24px_40px_-20px_rgba(35,43,69,0.6)] ring-1 ring-white/20">
                <div className="flex h-full flex-col border border-[#D8B76A]/60 p-3 text-center">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D8B76A]">Elena Wolska</span>
                  <span className="mt-3 font-serif text-[15px] font-semibold leading-tight text-cream">Mots mêlés, mots croisés &amp; jeux</span>
                  <span className="mt-1 font-serif text-[11px] italic text-cream/80">pour apprendre le</span>
                  <span className="mt-1 font-serif text-[17px] font-bold leading-tight text-[#D8B76A]">Tarot de Marseille</span>
                  <span className="mt-auto text-[9px] font-semibold uppercase tracking-[0.16em] text-cream/70">100 jeux</span>
                </div>
              </div>
              <div>
                <p className="font-serif text-[22px] font-semibold leading-tight text-aubergine">
                  Mots mêlés, mots croisés &amp; jeux pour apprendre le Tarot de Marseille
                </p>
                <p className="mt-1 font-serif text-[17px] italic text-mention">
                  100 jeux et leçons pour découvrir les cartes, leur histoire et l&apos;art de les lire.
                </p>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/85">
                  Les cartes du Tarot de Marseille, leur histoire et l&apos;art de les lire : on les apprend sans s&apos;en apercevoir, en
                  cherchant des mots, en remplissant des grilles. Dans la série « Les jeux d&apos;Elena ».
                </p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-[13px] font-semibold text-gold-dark">
                  <span aria-hidden>✦</span>Bientôt sur Amazon
                </p>
              </div>
            </div>
          </section>

          {/* Un jeu, tout de suite, ici */}
          <section className="mt-12">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">À jouer ici, offert</p>
            <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Les mots cachés du Carnet rose</h2>
            <p className="mt-2 max-w-2xl text-[15px] text-ink/85">
              Vingt-cinq mots de l&apos;amour karmique à retrouver dans la grille. Une nouvelle grille à chaque fois.
            </p>
            <div className="mt-5">
              <MotsCaches />
            </div>
          </section>
        </>
      )}
    </EspaceShell>
  );
}
