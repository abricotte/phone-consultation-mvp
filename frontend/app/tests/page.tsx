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

            <ul className={`mt-4 divide-y divide-black/5 overflow-hidden rounded-[22px] border ${th.bordure} ${th.teinte}`}>
              {entrees.map((e) => {
                const fait = dernierPar.get(e.slug);
                const actif = Boolean(e.test);
                const ligne = (
                  <>
                    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 font-serif text-[15px] text-gold-dark ring-1 ring-black/5">✦</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-serif text-[21px] font-semibold leading-tight ${actif ? "text-aubergine" : "text-aubergine/55"}`}>{e.titre}</span>
                      {fait && (
                        <span className="mt-0.5 block text-[13px] text-ink/80">Fait le {dateCourte(fait.creeLe)} · <span className="font-semibold text-aubergine">{fait.titreProfil}</span></span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[12px] font-semibold text-ink/70 ring-1 ring-black/5">{e.duree}</span>
                    <span className={`shrink-0 text-[14px] font-bold ${actif ? "text-prix" : "text-gold-dark"}`}>{actif ? (fait ? "Refaire →" : "Faire le test →") : "bientôt"}</span>
                  </>
                );
                return (
                  <li key={e.slug}>
                    {actif ? (
                      <a href={`/tests/${e.slug}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/60">{ligne}</a>
                    ) : (
                      <div className="flex items-center gap-4 px-5 py-4">{ligne}</div>
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
