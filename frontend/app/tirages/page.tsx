"use client";

import EspaceShell from "@/components/EspaceShell";
import { Filet, Eventail, Bientot } from "@/components/Ornements";

// MES TIRAGES — « Elena tire pour vous ». Deux tirages à la main : la
// Petite Pythie (une question) et le Grand Tableau (toute votre vie).
// La commande en ligne (paiement, file à un par semaine, livraison dans
// l'espace) arrive après le lancement : la page dit ce qui existe, à quel
// prix, et comment commander en attendant. Décisions et prix : Elena,
// 12-13 octobre 2026 (docs/espace-cliente-mon-univers.md).

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

export default function TiragesPage() {
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

      {/* ── La Petite Pythie ── */}
      <section className="grid items-center gap-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <Eventail images={PYTHIE} />
        </div>
        <div className="md:col-span-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Une question</p>
          <h2 className="mt-1 font-serif text-[34px] font-semibold leading-tight text-aubergine">La Petite Pythie</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
            Mon oracle : trente-six cartes que j&apos;ai peintes à la main, consacrées à Delphes et à Délos.
            J&apos;en tire trois pour vous, sur la question qui vous occupe — une décision, une hésitation, un
            « est-ce que je dois ».
          </p>
          <p className="mt-3 text-[14px] text-mention">
            Vous recevez la photo de vos trois cartes et une lecture d&apos;une à deux pages, sous trois jours.
          </p>
          <p className="mt-5 font-serif text-3xl font-semibold tabular-nums text-aubergine">39 €</p>
        </div>
      </section>

      <Filet />

      {/* ── Le Grand Tableau ── */}
      <section className="grid items-center gap-8 md:grid-cols-5">
        <div className="order-2 md:order-1 md:col-span-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
            Toute votre vie, en un regard
          </p>
          <h2 className="mt-1 font-serif text-[34px] font-semibold leading-tight text-aubergine">
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
        </div>
        <div className="order-1 md:order-2 md:col-span-2">
          <Tableau />
        </div>
      </section>

      <p className="mt-8 font-serif text-lg italic text-mention">
        Avec chaque tirage, si vous le souhaitez :{" "}
        <span className="font-jakarta text-[14px] not-italic text-ink">
          « on en parle », vingt minutes au téléphone après lecture — 39 € au lieu de 58.
        </span>
      </p>

      <Filet />

      {/* ── Commander, en attendant ── */}
      <section className="max-w-2xl">
        <h2 className="font-serif text-2xl font-semibold text-aubergine">Commander</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/85">
          La commande depuis votre espace — avec votre place dans la semaine et votre tirage à relire ici —
          ouvre dans quelques semaines. En attendant, demandez votre tirage à Elena lors d&apos;une
          consultation, ou par{" "}
          <a href="https://elena-wolska.com/contact" className="font-semibold text-prix hover:underline">
            le site
          </a>
          .
        </p>
        <Bientot>Commande et livraison dans votre espace — bientôt</Bientot>
      </section>
    </EspaceShell>
  );
}
