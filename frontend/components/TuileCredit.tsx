import { Icone } from "@/components/IconesEspace";

// MON CRÉDIT — la tuile B de l'accueil, la seule sombre : c'est elle qui
// donne le relief à la grille. Elle répond à « Combien me reste-t-il ? »
// et à rien d'autre : « Recharger » est un LIEN vers /credit, pas une
// recharge. « L'accueil décide, Mon crédit exécute. »
//
// « n'expire jamais » accolé au solde : c'est LA différence avec les
// plateformes, elle se lit en même temps que le chiffre.

/** « 58 € », « 14,50 € » */
export function euros(n: number): string {
  return Number.isInteger(n)
    ? `${n} €`
    : `${n.toFixed(2).replace(".", ",")} €`;
}

export default function TuileCredit({
  soldeEuros,
  soldeMinutes,
}: {
  soldeEuros: number;
  soldeMinutes: number;
}) {
  return (
    // Téléphone : une rangée, solde à gauche, bouton à droite.
    // Bureau : empilé, le bouton poussé en bas (mt-auto).
    <section className="relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl bg-aubergine p-5 text-cream md:flex-col md:items-stretch md:p-7">
      <span aria-hidden className="pointer-events-none absolute right-5 top-4 text-xl text-gold/60">
        ✦
      </span>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-light">
          Mon crédit
        </p>
        <p className="mt-1 font-serif text-[40px] font-semibold leading-none tabular-nums md:mt-3 md:text-[64px]">
          {soldeMinutes}
          <span className="ml-1.5 text-xl font-medium md:text-[26px]">min</span>
        </p>
        <p className="mt-2 text-[13px] text-cream/70">
          ≈ {euros(soldeEuros)} · n&apos;expire jamais
        </p>
      </div>

      <a
        href="/credit"
        className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-gold-light/50 bg-cream/10 px-4 py-3 text-sm font-semibold text-cream transition hover:bg-cream/20 md:mt-auto md:w-full"
      >
        Recharger
        <Icone nom="fleche" taille={16} />
      </a>
    </section>
  );
}
