"use client";

import { useEffect, useMemo, useState } from "react";
import type { Test, ResultatProfil, ResultatScore } from "@/lib/tests/types";

// Le moteur des tests spirituels : l'intro, une question à la fois, le
// résultat. Deux familles (voir lib/tests/types.ts). Le résultat est
// remonté à la page par `onResultat`, qui l'enregistre.

type Props = {
  test: Test;
  onResultat?: (r: { profil: string; titreProfil: string; score: number | null }) => void;
  dejaFait?: { titreProfil: string; creeLe: string } | null;
};

// Les textes d'Elena contiennent un peu de HTML (gras, espaces insécables).
function Html({ html, className }: { html: string; className?: string }) {
  return <p className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function TestSpirituel({ test, onResultat, dejaFait }: Props) {
  const [etape, setEtape] = useState<"intro" | "questions" | "resultat">("intro");
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState<(string | number)[]>([]);
  const total = test.questions.length;

  // Le résultat, calculé d'après les réponses — même règle que sur le site.
  const resultat = useMemo(() => {
    if (etape !== "resultat") return null;
    if (test.mode === "profils") {
      const scores: Record<string, number> = {};
      reponses.forEach((r) => { scores[String(r)] = (scores[String(r)] ?? 0) + 1; });
      const autres = Object.entries(scores).filter(([k]) => k !== test.fallbackCategory).sort((a, b) => b[1] - a[1]);
      const fb = scores[test.fallbackCategory] ?? 0;
      const cle = fb > (autres[0]?.[1] ?? 0) ? test.fallbackCategory : (autres[0]?.[0] ?? test.fallbackCategory);
      const second = autres.length > 1 && autres[1][1] >= 3 && cle !== test.fallbackCategory ? autres[1][0] : null;
      const r: ResultatProfil | undefined = test.results[cle];
      return { cle, score: null as number | null, profil: r as ResultatProfil | undefined, second: second ? test.results[second] : null, autres, message: cle === test.fallbackCategory ? test.spiritualMessageFallback : test.spiritualMessage };
    }
    const score = reponses.reduce<number>((acc, r) => acc + Number(r), 0);
    const palier = test.resultRanges.find((x) => score >= x.minScore) ?? test.resultRanges[test.resultRanges.length - 1];
    if (!palier) return null;
    return { cle: String(palier.minScore), score, palier: palier.result as ResultatScore };
  }, [etape, reponses, test]);

  useEffect(() => {
    if (!resultat || !onResultat) return;
    const titre = "profil" in resultat ? resultat.profil?.name ?? resultat.cle : resultat.palier.title;
    onResultat({ profil: resultat.cle, titreProfil: titre, score: resultat.score });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultat]);

  function repondre(valeur: string | number) {
    const suite = [...reponses]; suite[index] = valeur; setReponses(suite);
    if (index + 1 < total) setIndex(index + 1);
    else setEtape("resultat");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function recommencer() { setReponses([]); setIndex(0); setEtape("intro"); }

  /* ── Intro ── */
  if (etape === "intro") {
    return (
      <section className="max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">{test.tag}</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[42px]">{test.title}</h1>
        <p className="mt-2 font-serif text-xl italic leading-relaxed text-mention">{test.subtitle}</p>
        <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-ink/85">
          {test.intro.map((t, i) => <Html key={i} html={t} />)}
        </div>
        {dejaFait && (
          <p className="mt-5 rounded-[16px] border border-gold/30 bg-ivory px-4 py-3 text-[13px] text-ink/80">
            <span className="mr-2 text-gold">✦</span>Vous l&apos;avez déjà fait le {new Date(dejaFait.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} : <span className="font-semibold text-aubergine">{dejaFait.titreProfil}</span>. Le refaire ne l&apos;efface pas.
          </p>
        )}
        <button type="button" onClick={() => setEtape("questions")} className="mt-6 rounded-full bg-aubergine px-6 py-3 text-[14px] font-semibold text-cream hover:bg-aubergine/90">
          Commencer
        </button>
      </section>
    );
  }

  /* ── Questions ── */
  if (etape === "questions") {
    const q = test.questions[index];
    return (
      <section className="max-w-2xl">
        <div className="flex items-center justify-between text-[12px] text-mention">
          <span>Question {index + 1} sur {total}</span>
          {index > 0 && <button type="button" onClick={() => setIndex(index - 1)} className="hover:underline">← Précédente</button>}
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-greige/60">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <h2 className="mt-6 font-serif text-[28px] font-semibold leading-tight text-aubergine">{q.title}</h2>
        <ul className="mt-5 space-y-3">
          {q.options.map((o, i) => {
            const valeur = "category" in o ? o.category : o.score;
            const choisie = reponses[index] === valeur;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => repondre(valeur)}
                  className={`flex w-full items-start gap-3 rounded-[18px] border px-4 py-3.5 text-left text-[15px] leading-snug transition ${choisie ? "border-aubergine bg-ivory" : "border-greige bg-white/60 hover:border-gold/60 hover:bg-ivory"}`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blush font-serif text-[13px] font-semibold text-aubergine">
                    {"letter" in o ? o.letter : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-ink">{o.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  /* ── Résultat ── */
  if (!resultat) return null;
  if ("palier" in resultat && resultat.palier) {
    const r: ResultatScore = resultat.palier;
    return (
      <section className="max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Votre résultat</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight text-aubergine">{r.title}</h1>
        <p className="mt-2 font-serif text-xl italic text-mention">{r.subtitle}</p>
        <Html html={r.description} className="mt-5 text-[15px] leading-relaxed text-ink/85" />
        {r.signs.length > 0 && (
          <ul className="mt-5 space-y-2 text-[14px] text-ink/85">{r.signs.map((s) => <li key={s} className="flex gap-2"><span className="text-gold">✦</span><span>{s}</span></li>)}</ul>
        )}
        {r.advice.map((a) => (
          <div key={a.title} className="mt-5 rounded-[18px] border border-greige bg-ivory p-5">
            <p className="font-serif text-[18px] font-semibold text-aubergine">{a.title}</p>
            <Html html={a.text} className="mt-1.5 text-[14px] leading-relaxed text-ink/80" />
          </div>
        ))}
        <Pied recommencer={recommencer} />
      </section>
    );
  }
  const r = resultat.profil;
  const t = test.mode === "profils" ? test : null;
  return (
    <section className="max-w-2xl">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Votre résultat</p>
      {r ? (
        <>
          <div className="mt-1 flex items-start gap-5">
            {r.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image.src} alt={r.image.alt} className="w-24 shrink-0 rounded-lg shadow-soft" />
            )}
            <div>
              <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine">{r.name}</h1>
              <p className="mt-2 font-serif text-xl italic text-mention">{r.tagline}</p>
            </div>
          </div>
          <Html html={r.description} className="mt-5 text-[15px] leading-relaxed text-ink/85" />
          {r.howItWorks && <Html html={r.howItWorks} className="mt-3 text-[15px] leading-relaxed text-ink/85" />}
          {r.signs && r.signs.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Les signes</p>
              <ul className="mt-2 space-y-2 text-[14px] text-ink/85">{r.signs.map((s) => <li key={s} className="flex gap-2"><span className="text-gold">✦</span><span>{s}</span></li>)}</ul>
            </div>
          )}
          {r.development && r.development.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Pour avancer</p>
              <ul className="mt-2 space-y-2 text-[14px] text-ink/85">{r.development.map((s) => <li key={s} className="flex gap-2"><span className="text-gold">✦</span><span>{s}</span></li>)}</ul>
            </div>
          )}
          {r.practices && <Html html={r.practices} className="mt-5 rounded-[18px] border border-greige bg-ivory p-5 text-[14px] leading-relaxed text-ink/80" />}
          {r.affirmation && <p className="mt-5 font-serif text-xl italic leading-relaxed text-aubergine">« {r.affirmation} »</p>}
          {resultat.second && t && (
            <div className="mt-6 rounded-[18px] border border-gold/30 bg-[#FBF3E2] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">{t.labels?.secondaryTitle ?? "Votre tendance secondaire"}</p>
              <p className="mt-1 font-serif text-[20px] font-semibold text-aubergine">{resultat.second.name}</p>
              <p className="mt-1 text-[13px] text-ink/80">{t.labels?.secondaryDescription ?? ""}</p>
            </div>
          )}
          {r.links && r.links.length > 0 && (
            <p className="mt-5 text-[13px]">{r.links.map((l) => <a key={l.href} href={l.href} className="mr-4 font-semibold text-prix hover:underline">{l.label} →</a>)}</p>
          )}
        </>
      ) : (
        <h1 className="mt-1 font-serif text-3xl font-semibold text-aubergine">Aucune tendance nette</h1>
      )}
      {resultat.message && <p className="mt-6 font-serif text-lg italic leading-relaxed text-mention">{resultat.message}</p>}
      <Pied recommencer={recommencer} />
    </section>
  );
}

function Pied({ recommencer }: { recommencer: () => void }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-greige pt-5 text-[13px]">
      <a href="/tests" className="rounded-full bg-aubergine px-5 py-2.5 font-semibold text-cream hover:bg-aubergine/90">Retour aux tests</a>
      <button type="button" onClick={recommencer} className="font-semibold text-prix hover:underline">Refaire le test</button>
      <span className="text-mention">Votre résultat est gardé dans Mes résultats.</span>
    </div>
  );
}
