"use client";

import EspaceShell from "@/components/EspaceShell";
import { Bientot } from "@/components/Ornements";

// MÉTHODE WOLSKA — les études. C'est le nom de la gamme, comme « Hans
// Decoz » : on n'explique pas ce qu'il y a derrière (décision d'Elena,
// 14 octobre). Ce qui se voit : le processus — calculé, relu, signé — et
// les études à venir. La commande et la livraison arrivent après le
// lancement.

const ETUDES: [string, string, string, string][] = [
  ["I", "Votre contrat d'âme à deux", "Vous et une autre personne : le contrat qui lie vos deux âmes, vos dettes karmiques, la vibration de votre couple.", "29 €"],
  ["II", "Votre contrat d'âme", "Ce que votre âme est venue apprendre en amour.", "29 €"],
  ["III", "Votre année amoureuse", "Votre année personnelle, mois par mois, avec les lunes. À refaire à chaque anniversaire.", "29 €"],
  ["IV", "Votre prénom en amour", "Ce que votre prénom dit de votre façon d'aimer. Six pages, joli à offrir.", "12 €"],
];
const TEINTES = [
  "border-[#F0D9D3] bg-[#FBEFEB]",
  "border-[#EAD9B4] bg-[#FBF3E2]",
  "border-[#DED6EC] bg-[#F1EDF8]",
  "border-[#D3E0D2] bg-[#EDF4EC]",
];

export default function EtudesPage() {
  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
          Vos études, relues et signées
        </p>
        <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Méthode Wolska
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
          Vos dates parlent, je les écoute, puis je relis. Chaque étude est calculée d&apos;après ma méthode,{" "}
          <span className="font-semibold text-aubergine">relue et signée par moi</span> avant de vous être
          remise — sous 48 heures. Une page vous est offerte tout de suite.
        </p>
      </header>

      {/* La méthode en trois temps — le processus, pas les clés */}
      <ol className="grid gap-3 md:grid-cols-3">
        {[
          ["Vos dates parlent", "Ma méthode assemble ce que vos dates disent de vous — c'est ma grille, je la garde pour moi.", "♏︎"],
          ["Je relis", "Je connais mes clientes. Si une ligne ne vous ressemble pas, je la change ; j'ajoute ce que le calcul ne peut pas savoir.", "✎"],
          ["Je signe", "Vous recevez l'étude dans votre espace, avec un mot de moi en ouverture. Sous 48 heures.", "✦"],
        ].map(([t, d, g], i) => (
          <li key={t} className="flex gap-3 rounded-[20px] bg-ivory/70 px-4 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-serif text-xl text-gold-dark ring-1 ring-greige">
              {g}
            </span>
            <span>
              <span className="block font-semibold text-aubergine">
                {i + 1}. {t}
              </span>
              <span className="text-[13px] leading-relaxed text-ink/75">{d}</span>
            </span>
          </li>
        ))}
      </ol>

      <h2 className="mt-10 font-serif text-[30px] font-semibold text-aubergine">Les études</h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ETUDES.map(([n, t, d, p], i) => (
          <li
            key={t}
            className={`relative flex flex-col rounded-[20px] border px-5 pb-5 pt-6 ${TEINTES[i]}`}
          >
            <span aria-hidden className="absolute right-4 top-3 font-serif text-sm text-gold">✦</span>
            <span className="font-serif text-3xl text-gold-dark/70">{n}</span>
            <p className="mt-2 font-serif text-xl font-semibold leading-tight text-aubergine">{t}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/75">{d}</p>
            <p className="mt-auto flex items-baseline justify-between pt-5">
              <span className="text-[13px] text-mention">relue et signée</span>
              <span className="font-serif text-2xl font-semibold tabular-nums text-aubergine">{p}</span>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[14px] text-mention">
        Les trois premières ensemble, <span className="font-semibold text-ink">le bilan de l&apos;âme</span>,
        69 €. Et pour aller au bout :{" "}
        <span className="text-ink">trois cartes de la Petite Pythie tirées sur le sujet</span>, + 30 €.
      </p>

      <Bientot>Les études se commandent ici dans quelques semaines</Bientot>
    </EspaceShell>
  );
}
