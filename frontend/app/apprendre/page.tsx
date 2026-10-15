"use client";

import { useState } from "react";
import EspaceShell from "@/components/EspaceShell";
import MotsCaches from "@/components/MotsCaches";
import { Pilules } from "@/components/Ornements";

// APPRENDRE — ce qu'Elena sait des cartes, elle l'apprend. Deux onglets
// (Elena, 15 octobre), dans cet ordre : « Apprendre en s'amusant » (sa
// série de livres-jeux « Les Jeux d'Elena »), « Apprendre en écoutant » (le
// podcast La Minute Voyance, lecteur Spotify) et « 🎁 Petit cadeau
// d'Elena » (les mots cachés du Carnet rose, jouables ici, offerts). Les vidéos viendront quand Elena
// les aura commencées — on n'ouvre pas une pièce vide.

export default function ApprendrePage() {
  const [onglet, setOnglet] = useState<"jouer" | "ecouter" | "cadeau">("jouer");

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
        options={[["jouer", "Apprendre en s'amusant"], ["ecouter", "Apprendre en écoutant"], ["cadeau", "🎁 Petit cadeau d'Elena"]] as const}
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
          {/* La phrase d'Elena, dans un encadré blanc (15 octobre) */}
          <p className="mb-8 max-w-2xl rounded-[20px] border border-greige/70 bg-white px-5 py-4 font-serif text-[18px] italic leading-relaxed text-ink shadow-soft">
            J&apos;ai créé la série <span className="font-semibold not-italic text-aubergine">Les Jeux d&apos;Elena</span> pour vous apprendre la
            voyance et tout son univers en vous amusant.
          </p>

          {/* Les jeux d'Elena — la série de livres-jeux. En révision chez
              Amazon : pas de lien tant qu'il n'est pas en ligne. */}
          <section>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Ma série de livres-jeux</p>
            <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Les Jeux d&apos;Elena</h2>
            <div className="mt-5 grid items-start gap-6 sm:grid-cols-[180px_1fr]">
              {/* La vraie couverture (face avant, tirée du PDF KDP) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/apprendre/tarot-de-marseille-jeux.webp"
                alt="Couverture : Mots mêlés, mots croisés & jeux pour apprendre le Tarot de Marseille, Elena Wolska"
                className="w-[180px] rounded-r-xl rounded-l-sm shadow-[0_24px_40px_-20px_rgba(35,43,69,0.6)] ring-1 ring-black/10"
                style={{ aspectRatio: "8.5 / 11" }}
              />
              <div>
                <p className="font-serif text-[22px] font-semibold leading-tight text-aubergine">
                  Mots mêlés, mots croisés &amp; jeux pour apprendre le Tarot de Marseille
                </p>
                <p className="mt-1 font-serif text-[17px] italic text-mention">
                  100 jeux et leçons pour découvrir les cartes, leur histoire et l&apos;art de les lire.
                </p>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/85">
                  Les cartes du Tarot de Marseille, leur histoire et l&apos;art de les lire : on les apprend sans s&apos;en apercevoir, en
                  cherchant des mots, en remplissant des grilles.
                </p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-[13px] font-semibold text-gold-dark">
                  <span aria-hidden>✦</span>Bientôt sur Amazon
                </p>
                <a href="/librairie" className="mt-3 block text-[13px] font-semibold text-prix hover:underline">
                  Tous mes livres dans la librairie →
                </a>
              </div>
            </div>
          </section>

        </>
      )}

      {onglet === "cadeau" && (
        <section>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#FAD3E2] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#A3245A] ring-1 ring-[#F2B3CB]">
            🎁 Petit cadeau d&apos;Elena
          </p>
          <h2 className="mt-2 font-serif text-[30px] font-semibold text-aubergine">Les mots cachés du Carnet rose</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/85">
            Vingt-cinq mots de l&apos;amour karmique à retrouver dans la grille. Une nouvelle grille à chaque fois.
          </p>
          <div className="mt-5">
            <MotsCaches />
          </div>
        </section>
      )}
    </EspaceShell>
  );
}
