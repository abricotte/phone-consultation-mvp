"use client";

import EspaceShell from "@/components/EspaceShell";
import { Bientot } from "@/components/Ornements";

// TESTS SPIRITUELS — les six tests du site, gratuits, dans l'espace. Ce que
// le site ne peut pas offrir arrive ici : le résultat gardé et daté, et le
// partage avec Elena (une case, à elle de cocher). Le moteur et les six
// contenus sont portés juste après le menu (migration 014) — d'ici là, on
// renvoie vers les tests du site.

const TESTS = [
  ["Suis-je dans une relation karmique ?", "5 min", "https://elena-wolska.com/ressources-gratuites/quizz-relation-karmique"],
  ["Êtes-vous dans un amour placebo ?", "4 min", "https://elena-wolska.com/ressources-gratuites/amour-placebo"],
  ["Quel amour vous attend ?", "5 min", "https://elena-wolska.com/ressources-gratuites/quel-amour-vous-attend"],
  ["Votre schéma répétitif en amour", "7 min", "https://elena-wolska.com/ressources-gratuites/schema-amoureux"],
  ["Quel est mon contrat d'âme ?", "8 min", "https://elena-wolska.com/ressources-gratuites/quiz-contrat-ame"],
  ["Quel est mon don spirituel ?", "8 min", "https://elena-wolska.com/ressources-gratuites/quel-est-mon-don-spirituel"],
];
const TEINTES = [
  "border-[#DED6EC] bg-[#F1EDF8]",
  "border-[#D3E0D2] bg-[#EDF4EC]",
  "border-[#D4E0EA] bg-[#EBF2F7]",
  "border-[#EAD6DF] bg-[#F8EDF2]",
  "border-[#F0D9D3] bg-[#FBEFEB]",
  "border-[#EAD9B4] bg-[#FBF3E2]",
];

export default function TestsPage() {
  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Tests spirituels
        </h1>
        <p className="mt-3 text-[15px] text-ink/80">
          Six tests écrits par Elena, gratuits. Bientôt, vos résultats resteront ici, datés — et vous
          choisirez ce qu&apos;elle en voit.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TESTS.map(([t, d, href], i) => (
          <li key={t} className={`flex flex-col rounded-[20px] border px-5 py-4 ${TEINTES[i]}`}>
            <p className="font-serif text-xl font-semibold leading-tight text-aubergine">{t}</p>
            <p className="mt-2 text-[13px] text-mention">12 questions · {d}</p>
            <a
              href={href}
              className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 pt-3 text-[13px] font-semibold text-prix hover:underline"
            >
              Faire le test sur le site →
            </a>
          </li>
        ))}
      </ul>

      <Bientot>Les tests dans votre espace, avec vos résultats gardés — bientôt</Bientot>
    </EspaceShell>
  );
}
