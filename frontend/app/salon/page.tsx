"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceShell from "@/components/EspaceShell";
import { Eventail, Pilules } from "@/components/Ornements";

// LE SALON — ma voix, mes textes, mes carnets, mon jeu. Quatre rayons
// (Elena, 14 octobre, tard) : Écouter (les boosts, offerts, et une boîte
// à idées pour souffler un thème), Lire (mes articles, sur le site),
// Se découvrir (la collection des Carnets d'Elena, une couleur par
// thème), L'oracle de l'amour. Les jeux (mots cachés) ont rejoint
// Apprendre, onglet « Petit cadeau d'Elena » (Elena, 15 octobre).

const PYTHIE = ["/images/pythie/la-vision.webp", "/images/pythie/le-grand-amour.webp", "/images/pythie/le-rendez-vous.webp"];

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

// Mes articles — ils vivent sur le site ; ici, l'étagère. Trois rubriques.
const SITE = "https://elena-wolska.com/ressources-gratuites";
const ARTICLES: { rubrique: string; textes: [string, string][] }[] = [
  {
    rubrique: "Amour & relations",
    textes: [
      ["attendre-un-message", "Pourquoi attendre un message nous met dans un tel état"],
      ["signes-quil-elle-pense-a-vous", "Signes qu'il ou elle pense encore à vous"],
      ["pourquoi-on-tombe-toujours-amoureux-des-memes-personnes", "Pourquoi on tombe toujours amoureux des mêmes personnes"],
      ["intuition-ou-peur-en-amour", "Intuition ou peur en amour"],
      ["ghosting-amoureux", "Le ghosting amoureux"],
      ["dating-fatigue", "Pourquoi le dating est si difficile"],
      ["comment-rencontrer-amour-2026", "Comment rencontrer l'amour en 2026"],
      ["solitude", "Relativisons la solitude"],
      ["comprendre-un-lien-karmique", "Comprendre un lien karmique"],
      ["liens-dame", "Les liens d'âme"],
      ["les-12-contrats-dames", "Les douze contrats d'âme"],
      ["contrat-dame", "Le contrat d'âme, en grand"],
    ],
  },
  {
    rubrique: "Guérison & bien-être",
    textes: [
      ["calendrier-lunaire", "Le calendrier lunaire"],
      ["carte-des-chakras", "La carte des chakras"],
      ["guide-des-cristaux", "Le guide des cristaux"],
    ],
  },
  {
    rubrique: "Intuition & signes",
    textes: [
      ["heures-miroirs", "Les heures miroirs"],
      ["synchronicites", "Les synchronicités"],
    ],
  },
];

// La collection « Les Carnets d'Elena » : une couleur par thème. Le rose
// est paru ; le bleu est écrit ; les autres sont nommés, pas vendus.
type Carnet = { couleur: string; titre: string; sousTitre: string; promesse: string; teinte: string; encre: string; amazon?: string; etat: "paru" | "a_paraitre" | "a_venir" };
const CARNETS: Carnet[] = [
  { couleur: "Les Carnets roses", titre: "L'Amour karmique", sousTitre: "et les liens d'âme", promesse: "Pourquoi lui ? Pourquoi maintenant ? Dix tests pour voir clair dans vos liens.", teinte: "from-[#FBE3EA] to-[#F0C2D0]", encre: "text-[#8E2E55]", amazon: "https://www.amazon.co.uk/LAmour-Karmique-Carnets-dElena-Wolska/dp/B0H7PTQKGR", etat: "paru" },
  { couleur: "Les Carnets bleus", titre: "L'Intuition et la Voyance", sousTitre: "et la voyance qui sommeille en chacun de nous", promesse: "Dix tests pour révéler votre intuition : voir, entendre, ressentir, savoir.", teinte: "from-[#E3ECF7] to-[#BFD3EA]", encre: "text-[#2F6BA8]", etat: "a_paraitre" },
  { couleur: "Les Carnets violets", titre: "La Mission de vie", sousTitre: "et ce que votre âme est venue accomplir", promesse: "Dix tests pour révéler votre mission de vie.", teinte: "from-[#EEE6F7] to-[#D4C4EA]", encre: "text-[#5B3F8C]", etat: "a_venir" },
  { couleur: "Les Carnets dorés", titre: "L'Abondance", sousTitre: "et votre vraie relation à l'argent", promesse: "Dix tests pour libérer votre abondance.", teinte: "from-[#FBF3E2] to-[#EAD7A8]", encre: "text-[#8a6f3e]", etat: "a_venir" },
  { couleur: "Les Carnets verts", titre: "La Guérison familiale", sousTitre: "et les héritages invisibles de votre lignée", promesse: "Dix tests pour vous libérer des schémas familiaux.", teinte: "from-[#E9F3E8] to-[#C6DEC4]", encre: "text-[#2F5D3A]", etat: "a_venir" },
  { couleur: "Les Carnets blancs", titre: "Le Deuil et le lâcher-prise", sousTitre: "et l'art de traverser les fins avec douceur", promesse: "Dix tests pour traverser, et vous relever en douceur.", teinte: "from-white to-[#EFE9E3]", encre: "text-aubergine", etat: "a_venir" },
];

type Suggestion = { id: string; texte: string; creeLe: string };

function BoiteAIdees() {
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoyees, setEnvoyees] = useState<Suggestion[]>([]);
  const [merci, setMerci] = useState(false);

  useEffect(() => {
    api.getSuggestions().then((d: { suggestions: Suggestion[] }) => setEnvoyees(d?.suggestions ?? [])).catch(() => {});
  }, []);

  async function envoyer() {
    const t = texte.trim();
    if (!t) return;
    setEnvoi(true); setErreur("");
    try {
      const d = await api.suggerer({ texte: t });
      setEnvoyees((s) => [d.suggestion, ...s]);
      setTexte(""); setMerci(true);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="mt-8 rounded-[24px] border border-gold/30 bg-gradient-to-br from-[#FBF3E2] to-ivory p-5 md:p-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Une idée de boost ?</p>
      <h3 className="mt-1 font-serif text-[24px] font-semibold leading-tight text-aubergine">Soufflez-moi un thème</h3>
      <p className="mt-1.5 max-w-lg text-[14px] text-ink/80">
        Ce que vous aimeriez m&apos;entendre dire, un soir où ça tourne. Un mot, une situation, une question : je lis tout, et
        j&apos;enregistre ce qui revient le plus.
      </p>
      <label className="mt-4 block">
        <span className="sr-only">Votre idée</span>
        <textarea
          rows={3}
          value={texte}
          onChange={(e) => { setTexte(e.target.value); setMerci(false); }}
          maxLength={600}
          placeholder="Un boost pour le soir où il ne répond pas…"
          className="w-full rounded-[14px] border border-greige bg-white px-3.5 py-2.5 text-[14px] text-ink"
        />
      </label>
      {erreur && <p className="mt-2 text-[13px] text-red-600">{erreur}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={envoi || !texte.trim()}
          onClick={envoyer}
          className="rounded-full bg-aubergine px-5 py-2.5 text-[14px] font-semibold text-cream hover:bg-aubergine/90 disabled:opacity-50"
        >
          {envoi ? "Envoi…" : "Souffler mon idée à Elena"}
        </button>
        {merci && <p className="text-[13px] text-gold-dark"><span className="mr-1">✦</span>Reçue. Elena la lit dans son cabinet.</p>}
      </div>
      {envoyees.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-[12px] text-mention">Mes idées envoyées ({envoyees.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {envoyees.map((s) => (
              <li key={s.id} className="text-[13px] text-ink/80">
                <span className="text-mention">{new Date(s.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · </span>
                {s.texte}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function SalonPage() {
  const [onglet, setOnglet] = useState<"ecouter" | "lire" | "decouvrir" | "jeu">("ecouter");

  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Le salon
        </h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Ma voix, mes textes, mes carnets, mon jeu — ce que je vous laisse entre deux consultations.
        </p>
      </header>

      <Pilules
        label="Le salon"
        valeur={onglet}
        onChange={setOnglet}
        options={[["ecouter", "Écouter"], ["lire", "Lire"], ["decouvrir", "Se découvrir"], ["jeu", "L'oracle de l'amour"]] as const}
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
          <BoiteAIdees />
        </section>
      )}

      {onglet === "lire" && (
        <section>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Lire</p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Mes textes</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/85">
            Ce que dix-neuf ans de consultations m&apos;ont appris, en dix-sept textes. Ils vivent sur mon site — à lire quand vous
            voulez, à relire quand il faut.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {ARTICLES.map((r) => (
              <div key={r.rubrique} className="rounded-[20px] border border-greige/60 bg-ivory p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">{r.rubrique}</p>
                <ul className="mt-3 space-y-2">
                  {r.textes.map(([slug, titre]) => (
                    <li key={slug}>
                      <a href={`${SITE}/${slug}`} className="text-[14px] font-semibold leading-snug text-aubergine hover:text-prix hover:underline">
                        {titre}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {onglet === "decouvrir" && (
        <section>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Se découvrir</p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Les Carnets d&apos;Elena</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-ink/85">
            Une collection de carnets à remplir : dix tests, sept chapitres, un journal. Une couleur par thème. On y écrit, on
            y coche, on s&apos;y découvre.
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CARNETS.map((c) => {
              const couverture = (
                <span className={`block aspect-[2/3] rounded-r-xl rounded-l-sm bg-gradient-to-br p-5 shadow-[0_24px_40px_-20px_rgba(35,43,69,0.45)] ring-1 ring-white/60 transition ${c.teinte} ${c.etat === "paru" ? "group-hover:-translate-y-1.5 group-hover:rotate-[-1deg]" : "opacity-80"}`}>
                  <span className="block h-full border border-white/60 p-4">
                    <span className={`block text-[10px] font-semibold uppercase tracking-[0.2em] ${c.encre}`}>{c.couleur}</span>
                    <span className={`mt-5 block font-serif text-[24px] font-semibold leading-tight ${c.encre}`}>{c.titre}</span>
                    <span className={`mt-2 block font-serif text-[13px] italic leading-snug ${c.encre} opacity-80`}>{c.sousTitre}</span>
                    <span className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.14em] text-aubergine/60">Elena Wolska</span>
                  </span>
                </span>
              );
              return (
                <li key={c.titre} className="group">
                  {c.amazon ? <a href={c.amazon}>{couverture}</a> : couverture}
                  <p className="mt-4 font-semibold text-aubergine">{c.titre}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink/75">{c.promesse}</p>
                  {c.etat === "paru" && c.amazon ? (
                    <a href={c.amazon} className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-prix hover:underline">Sur Amazon →</a>
                  ) : (
                    <p className="mt-1.5 text-[12px] text-gold-dark">{c.etat === "a_paraitre" ? "à paraître" : "à venir"}</p>
                  )}
                </li>
              );
            })}
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
