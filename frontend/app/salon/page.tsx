"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceShell from "@/components/EspaceShell";
import IllustrationSalon from "@/components/IllustrationSalon";
import ListeBoosts from "@/components/ListeBoosts";
import { Pilules } from "@/components/Ornements";

// LE SALON — ma voix et mes textes, pour se faire du bien. Deux rayons
// (Elena, 15 octobre) : Écouter (les boosts, offerts, et une boîte à idées
// pour souffler un thème) et Lire (mes articles, sur le site). Tout est
// gratuit ici : les carnets et le jeu de la Pythie sont dans La librairie,
// les mots cachés dans Apprendre.



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
      <h3 className="mt-1 font-serif text-[24px] font-semibold leading-tight text-aubergine">
        Vous avez envie que j&apos;aborde un sujet particulier ?
      </h3>
      <p className="mt-1.5 max-w-lg text-[14px] text-ink/80">
        Soumettez-moi l&apos;idée. Un mot, une situation, une question : je lis tout, et j&apos;enregistre ce qui revient le plus.
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
          {envoi ? "Envoi…" : "Soumettre mon idée"}
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
  const [onglet, setOnglet] = useState<"ecouter" | "lire">("ecouter");

  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Le petit salon d&apos;Elena
        </h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Ma voix et mes textes — ce que je vous laisse entre deux consultations.
        </p>
      </header>

      {/* Le thé, les cartes, les étoiles (Elena, 16 octobre) */}
      <IllustrationSalon className="-mt-2 mb-6 w-full max-w-2xl" />

      <Pilules
        label="Le salon"
        valeur={onglet}
        onChange={setOnglet}
        options={[["ecouter", "Écouter"], ["lire", "Lire"]] as const}
      />

      {onglet === "ecouter" && (
        <section>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Les boosts · La Minute Voyance, saison 2</p>
          <h2 className="mt-1 font-serif text-[30px] font-semibold text-aubergine">Deux minutes avec Elena</h2>
          <p className="mt-2 max-w-md text-[14px] text-ink/80">
            Quelques minutes à écouter autour d&apos;une réflexion qui ouvre une perspective, bouscule une
            certitude ou tout simplement, apaise.
          </p>
          <p className="mt-1.5 text-[13px] text-mention">
            La saison 1, <a href="/apprendre?onglet=ecouter" className="font-semibold text-prix hover:underline">le Petit Lenormand en une minute</a>, est dans Apprendre.
          </p>
          <ListeBoosts />
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

      <p className="mt-10 text-[14px] text-ink/80">
        <span className="mr-2 text-gold">✦</span>
        Mes carnets, mes jeux et l&apos;oracle de la Petite Pythie sont dans{" "}
        <a href="/librairie" className="font-semibold text-prix hover:underline">la librairie</a>.
      </p>
    </EspaceShell>
  );
}
