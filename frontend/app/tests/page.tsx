"use client";

import { useEffect, useState } from "react";
import EspaceShell from "@/components/EspaceShell";
import { Filet } from "@/components/Ornements";
import { CATALOGUE, THEMES } from "@/lib/tests";
import type { ResultatEnregistre } from "@/lib/tests/types";
import { api } from "@/lib/api";

// TESTS SPIRITUELS — quinze tests écrits par Elena, offerts, rangés en
// trois thèmes (vous et l'autre · vous, en amour · votre lumière). Le
// résultat reste ici, daté. Elena le voit dans la fiche de la cliente
// avant de l'appeler (c'est dit sous chaque test). Rien n'est partagé.

function dateCourte(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function TestsPage() {
  const [resultats, setResultats] = useState<ResultatEnregistre[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    api.getTests().then((d: { resultats: ResultatEnregistre[] }) => setResultats(d?.resultats ?? [])).catch(() => {}).finally(() => setCharge(true));
  }, []);

  const dernierPar = new Map<string, ResultatEnregistre>();
  for (const r of resultats) if (!dernierPar.has(r.test)) dernierPar.set(r.test, r);
  const faits = CATALOGUE.filter((e) => dernierPar.has(e.slug)).length;

  async function effacer(id: string) {
    await api.deleteTest(id).catch(() => {});
    setResultats((rs) => rs.filter((r) => r.id !== id));
  }

  return (
    <EspaceShell>
      <header className="mb-10 max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Quinze tests, offerts</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">Tests spirituels</h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Quelques questions, et une page sur vous. Votre résultat reste ici, daté. Refaites-les quand vous voulez : six mois plus tard, un test raconte un chemin.
        </p>
        {charge && faits > 0 && (
          <p className="mt-3 text-[13px] text-ink/80">
            <span className="mr-2 text-gold">✦</span>{faits} test{faits > 1 ? "s" : ""} déjà fait{faits > 1 ? "s" : ""} sur quinze.
          </p>
        )}
      </header>

      {THEMES.map((th, ti) => {
        const entrees = CATALOGUE.filter((e) => e.theme === th.cle);
        return (
          <section key={th.cle} className={ti > 0 ? "mt-12" : ""}>
            <div className="flex items-end gap-4">
              <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${th.bordure} ${th.teinte} font-serif text-2xl text-aubergine`}>{th.glyphe}</span>
              <div>
                <h2 className="font-serif text-[30px] font-semibold leading-tight text-aubergine">{th.titre}</h2>
                <p className="font-serif text-[16px] italic text-mention">{th.sous}</p>
              </div>
            </div>

            <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {entrees.map((e, i) => {
                const fait = dernierPar.get(e.slug);
                const actif = Boolean(e.test);
                const corps = (
                  <>
                    <span aria-hidden className="absolute right-4 top-3 font-serif text-sm text-gold/80">✦</span>
                    <span className="font-serif text-[13px] text-gold-dark/70">{String(i + 1).padStart(2, "0")}</span>
                    <p className="mt-1 font-serif text-[21px] font-semibold leading-tight text-aubergine">{e.titre}</p>
                    <p className="mt-1.5 font-serif text-[15px] italic leading-snug text-mention">{e.question}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-ink/70 ring-1 ring-black/5">
                        {actif ? `${e.test!.questions.length} questions · ${e.duree}` : e.duree}
                      </span>
                      {actif ? (
                        <span className="text-[13px] font-semibold text-prix">{fait ? "Refaire →" : "Faire le test →"}</span>
                      ) : (
                        <span className="text-[12px] font-semibold text-gold-dark">bientôt</span>
                      )}
                    </div>
                    {fait && (
                      <p className="mt-3 border-t border-black/5 pt-2.5 text-[12px] text-ink/75">
                        Fait le {dateCourte(fait.creeLe)} · <span className="font-semibold text-aubergine">{fait.titreProfil}</span>
                      </p>
                    )}
                  </>
                );
                const classes = `relative flex h-full flex-col rounded-[22px] border px-5 pb-5 pt-4 ${th.bordure} ${th.teinte}`;
                return (
                  <li key={e.slug}>
                    {actif ? (
                      <a href={`/tests/${e.slug}`} className={`${classes} transition hover:-translate-y-1 hover:shadow-soft`}>{corps}</a>
                    ) : (
                      <div className={`${classes} opacity-75`}>{corps}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <Filet />

      <section className="max-w-2xl">
        <h2 className="font-serif text-[30px] font-semibold leading-tight text-aubergine">Mes résultats</h2>
        {!charge ? (
          <p className="mt-2 text-[14px] text-mention">Chargement…</p>
        ) : resultats.length === 0 ? (
          <p className="mt-2 font-serif text-[16px] italic text-mention">Aucun test fait pour l&apos;instant. Votre premier résultat s&apos;inscrira ici.</p>
        ) : (
          <ul className="mt-4 divide-y divide-greige rounded-[22px] border border-greige bg-ivory">
            {resultats.map((r) => {
              const e = CATALOGUE.find((x) => x.slug === r.test);
              const th = THEMES.find((t) => t.cle === e?.theme);
              return (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span aria-hidden className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${th?.teinte ?? "bg-blush"} font-serif text-aubergine`}>{th?.glyphe ?? "✦"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-mention">{dateCourte(r.creeLe)} · {e?.titre ?? r.test}</p>
                    <p className="font-serif text-[18px] font-semibold text-aubergine">{r.titreProfil}</p>
                  </div>
                  <a href={`/tests/${r.test}`} className="shrink-0 text-[12px] font-semibold text-prix hover:underline">Refaire</a>
                  <button type="button" onClick={() => effacer(r.id)} className="shrink-0 text-[12px] text-mention hover:underline">Effacer</button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[12px] text-mention">Elena voit vos résultats dans votre fiche, avant de vous appeler. Rien n&apos;est partagé ailleurs. Vous pouvez effacer un résultat quand vous voulez.</p>
      </section>
    </EspaceShell>
  );
}
