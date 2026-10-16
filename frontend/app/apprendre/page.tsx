"use client";

import { useEffect, useState } from "react";
import EspaceShell from "@/components/EspaceShell";
import MotsCaches from "@/components/MotsCaches";
import Bibliotheque from "@/components/Bibliotheque";
import { Pilules } from "@/components/Ornements";
import { CARTES_MINUTE, SPOTIFY_PODCAST } from "@/lib/minute-voyance";

// APPRENDRE — ce qu'Elena sait des cartes, elle l'apprend. Deux onglets
// (Elena, 15 octobre), dans cet ordre : « Apprendre en s'amusant » (sa
// série de livres-jeux « Les Jeux d'Elena »), « Apprendre en écoutant » (le
// podcast La Minute Voyance, lecteur Spotify) et « 🎁 Petit cadeau
// d'Elena » (les mots cachés du Carnet rose, jouables ici, offerts). Les vidéos viendront quand Elena
// les aura commencées — on n'ouvre pas une pièce vide.

export default function ApprendrePage() {
  const [onglet, setOnglet] = useState<"jouer" | "ecouter" | "lire" | "cadeau">("jouer");
  // Un lien peut ouvrir un onglet précis : /apprendre?onglet=lire
  useEffect(() => {
    const o = new URLSearchParams(window.location.search).get("onglet");
    if (o === "jouer" || o === "ecouter" || o === "lire" || o === "cadeau") setOnglet(o);
  }, []);
  // L'épisode à l'écoute : le premier, par défaut
  const [carte, setCarte] = useState<number>(1);
  const enCours = CARTES_MINUTE.find((c) => c.numero === carte && c.episode);

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
        options={[["jouer", "Apprendre en s'amusant"], ["ecouter", "Apprendre en écoutant"], ["lire", "Apprendre en lisant"], ["cadeau", "🎁 Petit cadeau d'Elena"]] as const}
      />

      {onglet === "ecouter" && (
        <section>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
            Mon podcast · La Minute Voyance · saison 1
          </p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Le Petit Lenormand en une minute</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/85">
            Les 36 cartes du Petit Lenormand, une par épisode : chaque carte racontée en une minute, son sens, sa force, ce
            qu&apos;elle vient vous dire — pour apprendre à les lire comme je les lis. Ici, et sur Spotify.
          </p>
          {/* LES 36 CARTES EN BULLES (Elena, 16 octobre) : un épisode par carte.
              Enregistrées : bleu nuit, numéro d'or, un clic les met à l'écoute.
              Pas encore : en gris, « à venir ». */}
          {enCours && (
            <div className="mt-5 rounded-[20px] bg-[#FBF3E2] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Carte n° {enCours.numero}</p>
              <p className="font-serif text-[22px] font-semibold leading-tight text-aubergine">{enCours.nom}</p>
              <p className="text-[13px] text-mention">{enCours.mots}</p>
              <iframe
                key={enCours.episode}
                title={`La Minute Voyance — ${enCours.nom}`}
                src={`https://open.spotify.com/embed/episode/${enCours.episode}?utm_source=generator&theme=0`}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="mt-3 rounded-[12px]"
              />
            </div>
          )}
          <ul className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-9">
            {CARTES_MINUTE.map((c) => {
              const pret = !!c.episode;
              const actif = c.numero === carte;
              return (
                <li key={c.numero}>
                  <button
                    type="button"
                    disabled={!pret}
                    onClick={() => setCarte(c.numero)}
                    aria-pressed={pret ? actif : undefined}
                    title={pret ? `${c.nom} — ${c.mots}` : `${c.nom} — à venir`}
                    className="group flex w-full flex-col items-center gap-1.5 text-center disabled:cursor-default"
                  >
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-full font-serif text-[20px] font-semibold transition ${
                        pret
                          ? actif
                            ? "bg-gold text-aubergine ring-4 ring-gold/30"
                            : "bg-aubergine text-gold-light group-hover:-translate-y-0.5 group-hover:ring-4 group-hover:ring-gold/25"
                          : "border border-dashed border-greige bg-[#F4F2EF] text-[#9E978F]"
                      }`}
                    >
                      {c.numero}
                    </span>
                    <span className={`text-[11.5px] leading-tight ${pret ? "font-semibold text-aubergine" : "text-[#9E978F]"}`}>{c.nom}</span>
                    {!pret && <span className="text-[10px] uppercase tracking-[0.08em] text-[#B4ADA5]">à venir</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[13px] text-mention">
            {CARTES_MINUTE.filter((c) => c.episode).length} cartes sur 36 enregistrées ·{" "}
            <a href={SPOTIFY_PODCAST} className="font-semibold text-prix hover:underline">le podcast sur Spotify →</a>
          </p>
          {/* La saison 2 : les boosts, dans le petit salon (Elena, 16 octobre) */}
          <a href="/salon" className="mt-6 flex max-w-2xl items-center gap-4 rounded-[20px] border border-[#F2B3CB] bg-[#FDF0F5] px-5 py-4 hover:shadow-soft">
            <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-aubergine font-serif text-[15px] font-semibold text-gold-light">S2</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3245A]">La Minute Voyance · saison 2</span>
              <span className="block font-serif text-[19px] font-semibold text-aubergine">Les boosts : deux minutes avec Elena</span>
              <span className="block text-[13px] text-ink/75">Pour les soirs où ça tourne. À écouter dans le petit salon.</span>
            </span>
            <span className="text-[14px] font-semibold text-prix">Écouter →</span>
          </a>
          <p className="mt-3 text-[13px] text-mention">
            Pour aller plus loin que la minute :{" "}
            <a href="/librairie" className="font-semibold text-prix hover:underline">
              mes carnets et mes livres
            </a>
            , dans la librairie.
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

      {/* Apprendre en lisant : sa bibliothèque (Elena, 16 octobre) */}
      {onglet === "lire" && <Bibliotheque />}

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
