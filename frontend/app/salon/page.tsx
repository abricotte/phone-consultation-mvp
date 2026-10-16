"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceShell from "@/components/EspaceShell";
import IllustrationSalon from "@/components/IllustrationSalon";
import { ClefDeLaSemaine } from "@/components/ListeBoosts";

// LE PETIT SALON D'ELENA — là où l'on vient se poser avec elle (Elena,
// 16 octobre). Apprendre, c'est là où l'on apprend ; le salon, c'est la
// tasse de thé. En haut, la petite clef de la semaine (une seule ; toutes
// sont dans Apprendre, saison 2). Puis deux onglets : Vos questions (on
// pose une question sur la spiritualité, l'amour, les comportements — pas
// sur sa propre histoire, c'est la consultation ; Elena répond ici, en
// privé, ou dans une petite clef) et Lire (ses articles, sur le site).
// En tableau de bord, pas en enfilade (Elena, 16 octobre) : la petite clef
// et les questions à gauche, les textes à droite ; une colonne sur téléphone.
// Plus tard : la carte du jour, quand le jeu de la Petite Pythie sera prêt.



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

type Suggestion = { id: string; texte: string; creeLe: string; reponse?: string | null; reponduLe?: string | null };

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
    <div className="rounded-[24px] border border-gold/30 bg-gradient-to-br from-[#FBF3E2] to-ivory p-5 md:p-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Vos questions, mes réponses</p>
      <h3 className="mt-1 font-serif text-[24px] font-semibold leading-tight text-aubergine">
        Vous avez envie que j&apos;aborde un sujet particulier ?
      </h3>
      <p className="mt-1.5 max-w-lg text-[14px] text-ink/80">
        Posez-moi votre question, ou soumettez-moi une idée : la spiritualité, l&apos;amour, ce qui se joue entre deux âmes, nos
        façons d&apos;aimer… Je lis tout. Je vous réponds ici, ou j&apos;en fais une petite clef.
      </p>
      {/* Le cadre, dit gentiment (Elena, 16 octobre) : du général ici, sa propre histoire en consultation */}
      <p className="mt-2 max-w-lg rounded-xl bg-white/70 px-3 py-2 text-[12.5px] leading-snug text-ink/75">
        Ici, on parle de tout, en général, comme autour d&apos;une tasse de thé 🙂 Merci de garder vos histoires personnelles pour la
        consultation : c&apos;est là que je peux vraiment vous répondre. Et votre question deviendra peut-être une petite clef que tout
        le monde écoutera.
      </p>
      <label className="mt-4 block">
        <span className="sr-only">Votre question ou votre idée</span>
        <textarea
          rows={3}
          value={texte}
          onChange={(e) => { setTexte(e.target.value); setMerci(false); }}
          maxLength={600}
          placeholder="Pourquoi a-t-on peur de se laisser aimer ?"
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
          {envoi ? "Envoi…" : "Envoyer à Elena"}
        </button>
        {merci && <p className="text-[13px] text-gold-dark"><span className="mr-1">✦</span>Reçue. Je la lis dans mon cabinet.</p>}
      </div>
      {envoyees.length > 0 && (
        <details className="mt-4" open={envoyees.some((s) => s.reponse)}>
          <summary className="cursor-pointer text-[12px] text-mention">
            Mes questions ({envoyees.length}){envoyees.some((s) => s.reponse) ? " · Elena vous a répondu" : ""}
          </summary>
          <ul className="mt-2 space-y-3">
            {envoyees.map((s) => (
              <li key={s.id} className="text-[13px] text-ink/80">
                <span className="text-mention">{new Date(s.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · </span>
                {s.texte}
                {s.reponse && (
                  <span className="mt-1.5 block rounded-xl border-l-4 border-gold/60 bg-white px-3 py-2 font-serif text-[15px] italic leading-relaxed text-ink">
                    {s.reponse}
                    <span className="mt-1 block font-sans text-[11.5px] not-italic text-mention">— Elena</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function SalonPage() {
  return (
    <EspaceShell>
      {/* En tête : le titre à gauche, le thé à droite */}
      <header className="mb-8 grid items-center gap-4 lg:grid-cols-2">
        <div>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
            Le petit salon d&apos;Elena
          </h1>
          <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
            Ma voix, vos questions, mes textes — ce que je vous laisse entre deux consultations.
          </p>
        </div>
        {/* Le thé, les cartes, les étoiles (Elena, 16 octobre) */}
        <IllustrationSalon className="w-full" />
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* À gauche : la petite clef de la semaine, puis vos questions */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <ClefDeLaSemaine />
          <BoiteAIdees />
        </div>

        {/* À droite : mes textes */}
        <section className="rounded-[24px] border border-greige/60 bg-ivory p-5 shadow-soft">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Lire</p>
          <h2 className="mt-1 font-serif text-[24px] font-semibold text-aubergine">Mes textes</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/80">
            Ce que dix-neuf ans de consultations m&apos;ont appris. À lire quand vous voulez, à relire quand il faut.
          </p>
          <div className="mt-4 space-y-5">
            {ARTICLES.map((r) => (
              <div key={r.rubrique}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">{r.rubrique}</p>
                <ul className="mt-2 space-y-1.5">
                  {r.textes.map(([slug, titre]) => (
                    <li key={slug}>
                      <a href={`${SITE}/${slug}`} className="text-[13.5px] font-semibold leading-snug text-aubergine hover:text-prix hover:underline">
                        {titre}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-10 text-[14px] text-ink/80">
        <span className="mr-2 text-gold">✦</span>
        Mes carnets, mes jeux et l&apos;oracle de la Petite Pythie sont dans{" "}
        <a href="/librairie" className="font-semibold text-prix hover:underline">la librairie</a>.
      </p>
    </EspaceShell>
  );
}
