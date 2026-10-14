"use client";

import { useState } from "react";
import EspaceShell from "@/components/EspaceShell";
import { Eventail } from "@/components/Ornements";

// MES TIRAGES — « Elena tire pour vous ». Deux tirages à la main, en deux
// colonnes, chacun avec son bouton « Je commande mon tirage » (Elena,
// 14 octobre). Le paiement sera relié à PayPal plus tard : d'ici là, le
// bouton dit comment commander. Décisions et prix : Elena, 12-14 octobre
// 2026 (docs/espace-cliente-mon-univers.md).

const PYTHIE = ["/images/pythie/la-vision.webp", "/images/pythie/le-grand-amour.webp", "/images/pythie/le-rendez-vous.webp"];
const LENORMAND = ["01-cavalier", "09-bouquet", "24-coeur", "29-femme", "31-soleil", "33-cle", "32-lune", "16-etoile"].map(
  (n) => `/images/lenormand/${n}.png`
);

function Tableau() {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl bg-gradient-to-br from-gold/15 to-blush p-4">
      {LENORMAND.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          style={{ transform: `rotate(${[-2, 1.5, -1, 2, 1, -2, 1.5, -1][i]}deg)` }}
          className="w-full rounded-md shadow-[0_10px_24px_-12px_rgba(35,43,69,0.5)] ring-1 ring-white/70"
        />
      ))}
    </div>
  );
}

type Tirage = "pythie" | "tableau";

export default function TiragesPage() {
  // Le bouton existe ; le paiement arrive. En attendant il dit comment faire.
  const [commande, setCommande] = useState<Tirage | null>(null);

  function BoutonCommande({ quoi }: { quoi: Tirage }) {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setCommande(commande === quoi ? null : quoi)}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-aubergine px-6 py-3 text-[14px] font-semibold text-cream hover:bg-aubergine/90"
        >
          Je commande mon tirage <span aria-hidden>→</span>
        </button>
        {commande === quoi && (
          <p className="mt-3 rounded-[16px] border border-gold/30 bg-ivory px-4 py-3 text-[13px] leading-relaxed text-ink/80">
            <span className="mr-2 text-gold">✦</span>
            Le paiement en ligne arrive. D&apos;ici là, demandez votre tirage à Elena lors d&apos;une consultation, ou par{" "}
            <a href="https://elena-wolska.com/contact" className="font-semibold text-prix hover:underline">le site</a>.
          </p>
        )}
      </div>
    );
  }

  return (
    <EspaceShell>
      <header className="mb-10 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Elena tire pour vous
        </h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Un tirage fait à la main, photographié, et une lecture écrite rien que pour vous — à lire, et
          relire.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── La Petite Pythie ── */}
        <section className="flex flex-col rounded-[28px] border border-[#EAD6DF] bg-[#F8EDF2] p-6 md:p-8">
          <Eventail images={PYTHIE} />
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Une question</p>
          <h2 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-aubergine">La Petite Pythie</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
            Mon oracle : trente-six cartes que j&apos;ai peintes à la main, consacrées à Delphes et à Délos.
            J&apos;en tire trois pour vous, sur la question qui vous occupe — une décision, une hésitation, un
            « est-ce que je dois ».
          </p>
          <p className="mt-3 text-[14px] text-mention">
            Vous recevez la photo de vos trois cartes et une lecture d&apos;une à deux pages, sous trois jours.
          </p>
          <p className="mt-5 font-serif text-3xl font-semibold tabular-nums text-aubergine">55 €</p>
          <div className="mt-auto">
            <BoutonCommande quoi="pythie" />
          </div>
        </section>

        {/* ── Le Grand Tableau ── */}
        <section className="flex flex-col rounded-[28px] border border-[#EAD9B4] bg-[#FBF3E2] p-6 md:p-8">
          <Tableau />
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
            Toute votre vie, en un regard
          </p>
          <h2 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-aubergine">
            Le Grand Tableau Lenormand
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
            Les trente-six cartes posées d&apos;un coup. On y lit l&apos;amour, le travail, l&apos;argent, le foyer,
            les personnes qui comptent, et les mois qui viennent. C&apos;est le tirage que l&apos;on fait une
            fois ou deux par an, aux moments où tout bascule.
          </p>
          <p className="mt-3 text-[14px] text-mention">
            Vous recevez la photo de votre tableau, une étude de trente à quarante pages avec vos questions
            et un sommaire — <span className="text-ink">et ma voix, qui vous la raconte</span>. Sous sept
            jours.
          </p>
          <p className="mt-4 text-[14px] text-ink">
            <span className="mr-2 text-gold">✦</span>
            <span className="font-semibold">Un seul tirage du Grand Tableau est effectué par semaine.</span>
          </p>
          <p className="mt-5 font-serif text-3xl font-semibold tabular-nums text-aubergine">149 €</p>
          <div className="mt-auto">
            <BoutonCommande quoi="tableau" />
          </div>
        </section>
      </div>

      <p className="mt-8 font-serif text-lg italic text-mention">
        Avec chaque tirage, si vous le souhaitez :{" "}
        <span className="font-jakarta text-[14px] not-italic text-ink">
          « on en parle », vingt minutes au téléphone après lecture — 39 € au lieu de 58.
        </span>
      </p>
    </EspaceShell>
  );
}
