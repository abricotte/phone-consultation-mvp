"use client";

import { useEffect, useState } from "react";
import EspaceShell from "@/components/EspaceShell";
import { Filet } from "@/components/Ornements";
import { CATALOGUE } from "@/lib/tests";
import type { ResultatEnregistre } from "@/lib/tests/types";
import { api } from "@/lib/api";

// TESTS SPIRITUELS — quinze tests écrits par Elena, gratuits, dans l'espace.
// Le résultat reste ici, daté. Elena le voit dans la fiche de la cliente
// avant de l'appeler (c'est dit sous chaque test). Rien n'est partagé ailleurs.

const TEINTES = [
  "border-[#DED6EC] bg-[#F1EDF8]",
  "border-[#D3E0D2] bg-[#EDF4EC]",
  "border-[#D4E0EA] bg-[#EBF2F7]",
  "border-[#EAD6DF] bg-[#F8EDF2]",
  "border-[#F0D9D3] bg-[#FBEFEB]",
  "border-[#EAD9B4] bg-[#FBF3E2]",
];

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

  async function effacer(id: string) {
    await api.deleteTest(id).catch(() => {});
    setResultats((rs) => rs.filter((r) => r.id !== id));
  }

  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">Tests spirituels</h1>
        <p className="mt-3 text-[15px] text-ink/80">
          Quinze tests écrits par Elena, offerts. Votre résultat reste ici, daté. Refaites-les quand vous voulez : six mois plus tard, un test raconte un chemin.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATALOGUE.map((e, i) => {
          const fait = dernierPar.get(e.slug);
          const actif = Boolean(e.test);
          return (
            <li key={e.slug} className={`flex flex-col rounded-[20px] border px-5 py-4 ${TEINTES[i % TEINTES.length]} ${actif ? "" : "opacity-80"}`}>
              <p className="font-serif text-xl font-semibold leading-tight text-aubergine">{e.titre}</p>
              <p className="mt-1 font-serif text-[15px] italic text-mention">{e.question}</p>
              <p className="mt-2 text-[12px] text-mention">
                {actif ? `${e.test!.questions.length} questions · ${e.duree}` : e.duree}
                {fait && <> · <span className="text-ink">fait le {dateCourte(fait.creeLe)}</span></>}
              </p>
              {actif ? (
                <a href={`/tests/${e.slug}`} className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 pt-3 text-[13px] font-semibold text-prix hover:underline">
                  {fait ? "Refaire le test →" : "Faire le test →"}
                </a>
              ) : (
                <span className="mt-auto inline-flex min-h-[44px] items-center pt-3 text-[12px] font-semibold text-gold-dark">bientôt</span>
              )}
            </li>
          );
        })}
      </ul>

      <Filet />

      <section className="max-w-2xl">
        <h2 className="font-serif text-[28px] font-semibold leading-tight text-aubergine">Mes résultats</h2>
        {!charge ? (
          <p className="mt-2 text-[14px] text-mention">Chargement…</p>
        ) : resultats.length === 0 ? (
          <p className="mt-2 text-[14px] text-mention">Aucun test fait pour l&apos;instant. Votre premier résultat s&apos;inscrira ici.</p>
        ) : (
          <ul className="mt-4 divide-y divide-greige rounded-[20px] border border-greige bg-ivory">
            {resultats.map((r) => {
              const e = CATALOGUE.find((x) => x.slug === r.test);
              return (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
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
