"use client";

import EspaceShell from "@/components/EspaceShell";

// APPRENDRE — ce qu'Elena sait des cartes, elle l'apprend. Pour l'instant :
// le podcast sur le Lenormand (La Minute Voyance, lecteur Spotify : rien à
// héberger). Les vidéos viendront quand Elena les aura commencées — on
// n'ouvre pas une pièce vide (retirées le 14 octobre, à sa demande).

export default function ApprendrePage() {
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
            Les Carnets d&apos;Elena Wolska
          </a>
          , dans le salon.
        </p>
      </section>
    </EspaceShell>
  );
}
