"use client";

import { useState } from "react";
import EspaceShell from "@/components/EspaceShell";
import { Eventail, Pilules } from "@/components/Ornements";

// LE SALON — ma voix, mes carnets et mes livres, mon oracle. Trois pilules :
// Écouter (les boosts, offerts, pas d'abonnement), Lire et grandir (les
// Carnets d'Elena Wolska et les livres : la couverture et le lien Amazon,
// rien d'autre), L'oracle de l'amour (la Petite Pythie). Les boosts,
// les couvertures et les liens sont fournis par Elena : en attendant,
// chaque rayon dit ce qui vient. Décisions : 14 octobre 2026.

const PYTHIE = ["/images/pythie/la-vision.webp", "/images/pythie/le-grand-amour.webp", "/images/pythie/le-rendez-vous.webp"];

// Carnets et livres : la couverture, le titre, le lien — rien d'autre (Elena, 14 octobre).
// `collection` : la série du livre (« Les Carnets d'Elena Wolska »), affichée sur la couverture.
const LIVRES = [
  {
    titre: "L'Amour Karmique",
    sousTitre: "Reconnaître le lien qui vous unit",
    collection: "Les Carnets d'Elena Wolska",
    amazon: "https://www.amazon.co.uk/LAmour-Karmique-Carnets-dElena-Wolska/dp/B0H7PTQKGR",
    teinte: "from-[#F1EDF8] to-[#DED6EC]",
  },
];

// Les boosts : un fichier audio par boost (fourni par Elena, dans
// public/audio/boosts), sa durée ; sans fichier, le boost est « bientôt ».
type Boost = { titre: string; src?: string; duree?: string };
const BOOSTS: Boost[] = [
  { titre: "La vulnérabilité, c'est beau aussi", src: "/audio/boosts/la-vulnerabilite.mp4", duree: "2 min 37" },
  { titre: "Avant de lui écrire" },
  { titre: "La solitude est belle, profitez-en" },
  { titre: "Après une rupture" },
  { titre: "Est-ce que vous l'aimez vraiment ?" },
];

export default function SalonPage() {
  const [onglet, setOnglet] = useState<"ecouter" | "lire" | "jeu">("ecouter");

  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Le salon
        </h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Ma voix, mes livres, mon jeu — ce que je vous laisse entre deux consultations.
        </p>
      </header>

      <Pilules
        label="Le salon"
        valeur={onglet}
        onChange={setOnglet}
        options={[["ecouter", "Écouter"], ["lire", "Lire et grandir"], ["jeu", "L'oracle de l'amour"]] as const}
      />

      {onglet === "ecouter" && (
        <section>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Les boosts</p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Deux minutes avec Elena</h2>
          <p className="mt-2 max-w-md text-[14px] text-ink/80">
            Quelques minutes à écouter autour d&apos;une réflexion qui ouvre une perspective, bouscule une
            certitude ou tout simplement, apaise.
          </p>
          <ul className="mt-5 divide-y divide-greige/50 rounded-[20px] border border-greige/60 bg-ivory">
            {BOOSTS.map((b) => (
              <li key={b.titre} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${b.src ? "bg-aubergine text-cream" : "bg-blush text-aubergine/50"}`}
                  >
                    <span className="ml-0.5 border-y-[7px] border-l-[11px] border-y-transparent border-l-current" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-aubergine">{b.titre}</span>
                    {b.duree && <span className="block text-[12px] text-mention">{b.duree} · la voix d&apos;Elena</span>}
                  </span>
                  <span className="shrink-0 text-[12px] text-gold-dark">{b.src ? "offert" : "offert · bientôt"}</span>
                </div>
                {b.src && (
                  // Un mp4 avec une piste audio se lit dans <audio> : le navigateur ignore l'image.
                  <audio controls preload="metadata" src={b.src} className="mt-3 w-full">
                    Votre navigateur ne lit pas cet audio.
                  </audio>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-mention">
            Offerts à mes clientes — pas d&apos;abonnement, jamais. Un nouveau boost de temps en temps, quand
            j&apos;ai quelque chose à vous dire. Le podcast sur le Lenormand a sa place dans{" "}
            <a href="/apprendre" className="font-semibold text-prix hover:underline">
              Apprendre
            </a>
            .
          </p>
        </section>
      )}

      {onglet === "lire" && (
        <section>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Lire et grandir</p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Mes carnets et mes livres</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/85">
            Ce que dix-neuf ans de consultations m&apos;ont appris — les Carnets, et les livres. À lire, et à garder.
          </p>
          <ul className="mt-6 grid gap-8 sm:grid-cols-3">
            {LIVRES.map((l) => (
              <li key={l.titre} className="group">
                {/* La couverture : l'objet. Un aplat tant qu'Elena n'a pas fourni la vraie. */}
                <a
                  href={l.amazon}
                  className={`block aspect-[2/3] rounded-r-xl rounded-l-sm bg-gradient-to-br p-6 shadow-[0_24px_40px_-20px_rgba(35,43,69,0.5)] ring-1 ring-white/60 transition group-hover:-translate-y-1.5 group-hover:rotate-[-1deg] ${l.teinte}`}
                >
                  <span className="block h-full border border-white/50 p-4">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-aubergine/70">
                      {l.collection}
                    </span>
                    <span className="mt-6 block font-serif text-2xl font-semibold leading-tight text-aubergine">{l.titre}</span>
                    <span className="mt-2 block font-serif text-sm italic text-aubergine/70">{l.sousTitre}</span>
                  </span>
                </a>
                <p className="mt-4 font-semibold text-aubergine">{l.titre}</p>
                <a href={l.amazon} className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-prix hover:underline">
                  Sur Amazon →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {onglet === "jeu" && (
        <section className="grid items-center gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Eventail images={PYTHIE} />
          </div>
          <div className="md:col-span-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
              L&apos;oracle de l&apos;amour · 36 cartes
            </p>
            <h2 className="mt-1 font-serif text-[34px] font-semibold leading-tight text-aubergine">La Petite Pythie</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
              Il y a très longtemps, on venait de toute la Grèce interroger la Pythie. Aujourd&apos;hui, elle
              revient pour parler d&apos;amour. Trente-six cartes que j&apos;ai peintes à la main, à l&apos;huile et
              au pastel, consacrées à Delphes au temple d&apos;Apollon et à Délos, l&apos;île de la lumière.
            </p>
            <p className="mt-3 text-[14px] text-mention">
              Le jeu est en cours d&apos;impression. En attendant, c&apos;est avec les cartes originales que je tire
              pour vous, dans{" "}
              <a href="/tirages" className="font-semibold text-prix hover:underline">
                Mes tirages
              </a>
              .
            </p>
            <a
              href="https://elena-wolska.com/oracle"
              className="mt-4 inline-block text-[13px] font-semibold text-prix hover:underline"
            >
              L&apos;histoire du jeu, sur le site →
            </a>
          </div>
        </section>
      )}
    </EspaceShell>
  );
}
