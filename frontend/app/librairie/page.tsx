"use client";

import EspaceShell from "@/components/EspaceShell";
import { Eventail } from "@/components/Ornements";

// LA LIBRAIRIE (Elena, 15 octobre) : tout ce qui s'achète au même endroit,
// en vitrine, pour que le salon et Apprendre restent entièrement gratuits.
// Trois rayons, visibles d'un coup (pas d'onglet : trop de clics tue
// l'action) : les Carnets d'Elena, les Jeux d'Elena, la Petite Pythie.
// Chaque livre : sa couverture, son titre, « Sur Amazon » s'il est paru,
// « à paraître » ou « à venir » sinon. Pas de vente ici : le lien mène à
// Amazon (ou au site pour le jeu).

type Carnet = { couleur: string; titre: string; sousTitre: string; promesse: string; teinte: string; encre: string; amazon?: string; etat: "paru" | "a_paraitre" | "a_venir" };
const CARNETS: Carnet[] = [
  { couleur: "Les Carnets roses", titre: "L'Amour karmique", sousTitre: "et les liens d'âme", promesse: "Pourquoi lui ? Pourquoi maintenant ? Dix tests pour voir clair dans vos liens.", teinte: "from-[#FBE3EA] to-[#F0C2D0]", encre: "text-[#8E2E55]", amazon: "https://www.amazon.co.uk/LAmour-Karmique-Carnets-dElena-Wolska/dp/B0H7PTQKGR", etat: "paru" },
  { couleur: "Les Carnets bleus", titre: "L'Intuition et la Voyance", sousTitre: "et la voyance qui sommeille en chacun de nous", promesse: "Dix tests pour révéler votre intuition : voir, entendre, ressentir, savoir.", teinte: "from-[#E3ECF7] to-[#BFD3EA]", encre: "text-[#2F6BA8]", etat: "a_paraitre" },
  { couleur: "Les Carnets violets", titre: "La Mission de vie", sousTitre: "et ce que votre âme est venue accomplir", promesse: "Dix tests pour révéler votre mission de vie.", teinte: "from-[#EEE6F7] to-[#D4C4EA]", encre: "text-[#5B3F8C]", etat: "a_venir" },
  { couleur: "Les Carnets dorés", titre: "L'Abondance", sousTitre: "et votre vraie relation à l'argent", promesse: "Dix tests pour libérer votre abondance.", teinte: "from-[#FBF3E2] to-[#EAD7A8]", encre: "text-[#8a6f3e]", etat: "a_venir" },
  { couleur: "Les Carnets verts", titre: "La Guérison familiale", sousTitre: "et les héritages invisibles de votre lignée", promesse: "Dix tests pour vous libérer des schémas familiaux.", teinte: "from-[#E9F3E8] to-[#C6DEC4]", encre: "text-[#2F5D3A]", etat: "a_venir" },
  { couleur: "Les Carnets blancs", titre: "Le Deuil et le lâcher-prise", sousTitre: "et l'art de traverser les fins avec douceur", promesse: "Dix tests pour traverser, et vous relever en douceur.", teinte: "from-white to-[#EFE9E3]", encre: "text-aubergine", etat: "a_venir" },
];

const PYTHIE = ["/images/pythie/la-vision.webp", "/images/pythie/le-grand-amour.webp", "/images/pythie/le-rendez-vous.webp"];

function Etat({ etat, amazon }: { etat: "paru" | "a_paraitre" | "a_venir"; amazon?: string }) {
  if (etat === "paru" && amazon) {
    return (
      <a href={amazon} className="mt-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-aubergine px-3.5 py-1.5 text-[13px] font-semibold text-cream hover:bg-aubergine/90">
        Sur Amazon →
      </a>
    );
  }
  return (
    <p className="mt-2 inline-flex whitespace-nowrap rounded-full bg-gold/15 px-3 py-1 text-[12px] font-semibold text-gold-dark">
      {etat === "a_paraitre" ? "Bientôt sur Amazon" : "À venir"}
    </p>
  );
}

export default function LibrairiePage() {
  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">La librairie</h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Des carnets à remplir, des jeux pour apprendre, un oracle pour parler d&apos;amour. À feuilleter, à offrir, à garder.
        </p>
      </header>

      {/* Les Carnets d'Elena */}
      <section>
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Une couleur par thème</p>
        <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Les Carnets d&apos;Elena</h2>
        <p className="mt-2 max-w-2xl text-[15px] text-ink/85">
          Des carnets à remplir : dix tests, sept chapitres, un journal. On y écrit, on y coche, on s&apos;y découvre.
        </p>
        <ul className="mt-6 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {CARNETS.map((c) => {
            const couverture = (
              <span className={`block aspect-[2/3] rounded-r-xl rounded-l-sm bg-gradient-to-br p-4 shadow-[0_20px_36px_-20px_rgba(35,43,69,0.45)] ring-1 ring-white/60 transition ${c.teinte} ${c.etat === "paru" ? "group-hover:-translate-y-1.5 group-hover:rotate-[-1deg]" : "opacity-85"}`}>
                <span className="block h-full border border-white/60 p-3">
                  <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${c.encre}`}>{c.couleur}</span>
                  <span className={`mt-4 block font-serif text-[21px] font-semibold leading-tight ${c.encre}`}>{c.titre}</span>
                  <span className={`mt-2 block font-serif text-[13px] italic leading-snug ${c.encre} opacity-80`}>{c.sousTitre}</span>
                </span>
              </span>
            );
            return (
              <li key={c.titre} className="group">
                {c.amazon ? <a href={c.amazon}>{couverture}</a> : couverture}
                <p className="mt-3 text-[14px] font-semibold leading-snug text-aubergine">{c.titre}</p>
                <p className="mt-0.5 line-clamp-3 text-[12.5px] leading-snug text-ink/75">{c.promesse}</p>
                <Etat etat={c.etat} amazon={c.amazon} />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Les Jeux d'Elena */}
      <section className="mt-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Apprendre en s&apos;amusant</p>
        <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Les Jeux d&apos;Elena</h2>
        <div className="mt-5 grid items-start gap-6 sm:grid-cols-[180px_1fr]">
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
            <Etat etat="a_paraitre" />
          </div>
        </div>
      </section>

      {/* La Petite Pythie */}
      <section className="mt-14 grid items-center gap-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex justify-center overflow-hidden rounded-[22px] bg-[#F8EDF2] px-4 pb-4 pt-8 ring-1 ring-white/70">
            <Eventail images={PYTHIE} taille={115} />
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">L&apos;oracle de l&apos;amour · 36 cartes</p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold leading-tight text-aubergine">La Petite Pythie</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
            Il y a très longtemps, on venait de toute la Grèce interroger la Pythie. Aujourd&apos;hui, elle revient pour parler
            d&apos;amour. Trente-six cartes que j&apos;ai peintes à la main, à l&apos;huile et au pastel, consacrées à Delphes au temple
            d&apos;Apollon et à Délos, l&apos;île de la lumière.
          </p>
          <p className="mt-3 text-[14px] text-mention">
            Le jeu est en cours d&apos;impression. En attendant, c&apos;est avec les cartes originales que je tire pour vous, dans{" "}
            <a href="/tirages" className="font-semibold text-prix hover:underline">Mes tirages</a>.
          </p>
          <a href="https://elena-wolska.com/oracle" className="mt-4 inline-block text-[13px] font-semibold text-prix hover:underline">
            L&apos;histoire du jeu, sur le site →
          </a>
        </div>
      </section>
    </EspaceShell>
  );
}
