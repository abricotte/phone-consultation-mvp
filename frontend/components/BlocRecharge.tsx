"use client";

import { useState } from "react";
import { api } from "@/lib/api";

// LA RECHARGE — paliers + curseur, un clic = paiement Stripe.
//
// Elle vit sur la page « Mon crédit », et seulement là. Principe posé
// par Elena : l'accueil DÉCIDE (appeler, réserver), cette page EXÉCUTE.
// La cliente ne choisit jamais entre « appeler » et « recharger » — le
// système sait, et l'amène ici uniquement quand c'est nécessaire.

function prixDe(minutes: number, cents: number): string {
  const euros = (minutes * cents) / 100;
  return (
    euros.toLocaleString("fr-FR", {
      minimumFractionDigits: euros % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

interface Props {
  prixMinuteCents: number;
  suggestionsMinutes: number[];
  minMinutes: number;
  maxMinutes: number;
  pasMinutes: number;
}

export default function BlocRecharge({
  prixMinuteCents,
  suggestionsMinutes,
  minMinutes,
  maxMinutes,
  pasMinutes,
}: Props) {
  const [rechargeEnCours, setRechargeEnCours] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");
  const [autreMinutes, setAutreMinutes] = useState(
    maxMinutes >= 45 ? 45 : maxMinutes
  );

  // Remplissage du curseur : la piste est orange jusqu'au pouce
  const progression =
    maxMinutes > minMinutes
      ? Math.round(((autreMinutes - minMinutes) / (maxMinutes - minMinutes)) * 100)
      : 0;

  // Colonnes selon le nombre de paliers — classes en toutes lettres,
  // Tailwind ne compile que ce qu'il lit dans le source.
  const grille =
    suggestionsMinutes.length <= 2
      ? "grid-cols-2"
      : suggestionsMinutes.length === 3
        ? "grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  async function recharger(minutes: number) {
    setErreur("");
    setRechargeEnCours(minutes);
    try {
      const data = await api.topUp(minutes);
      if (data.url) {
        window.location.href = data.url;
        return; // on quitte la page vers Stripe
      }
      throw new Error("Paiement indisponible, réessayez.");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      setRechargeEnCours(null);
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
        Recharge express
      </p>

      <div className={`mt-3 grid gap-2.5 ${grille}`}>
        {suggestionsMinutes.map((m) => (
          <button
            key={m}
            onClick={() => recharger(m)}
            disabled={rechargeEnCours !== null}
            className="rounded-2xl bg-cta px-3 py-3.5 text-center shadow-card transition hover:bg-cta-dark disabled:opacity-50"
          >
            <span className="block text-lg font-bold tracking-tight text-cta-text">
              {rechargeEnCours === m ? "…" : `+${m} min`}
            </span>
            <span className="text-xs font-medium text-cta-text/90">
              {prixDe(m, prixMinuteCents)}
            </span>
          </button>
        ))}
      </div>

      {/* Durée libre, au curseur — le prix suit le doigt */}
      <div className="mt-4 rounded-2xl border-2 border-dashed border-cta/45 bg-cream/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-prix">
            Ou choisissez votre durée, à la minute près
          </span>
          <span className="text-xs italic text-mention">
            de {minMinutes} à {maxMinutes} min · {prixDe(1, prixMinuteCents)}/min
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input
            type="range"
            min={minMinutes}
            max={maxMinutes}
            step={pasMinutes}
            value={autreMinutes}
            onChange={(e) => setAutreMinutes(Number(e.target.value))}
            aria-label="Choisir la durée en minutes"
            className="h-1.5 min-w-[9rem] flex-1 cursor-pointer appearance-none rounded-full bg-greige accent-cta"
            // #C24818 = couleur `cta` du theme (tailwind.config.ts) ;
            // un degrade inline ne peut pas lire les classes Tailwind.
            style={{
              background: `linear-gradient(90deg, #C24818 ${progression}%, #EFE3D5 ${progression}%)`,
            }}
          />
          <span className="rounded-2xl bg-aubergine px-4 py-2 text-center text-cream">
            <span className="block font-serif text-lg font-semibold tabular-nums">
              {autreMinutes} min
            </span>
            <span className="block text-xs text-cream/70 tabular-nums">
              {prixDe(autreMinutes, prixMinuteCents)}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => recharger(autreMinutes)}
          disabled={rechargeEnCours !== null}
          className="mt-4 w-full rounded-2xl bg-cta px-5 py-3.5 font-semibold text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
        >
          {rechargeEnCours === autreMinutes
            ? "…"
            : `Recharger ${autreMinutes} min — ${prixDe(autreMinutes, prixMinuteCents)}`}
        </button>
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-mention">
        Un clic et vous passez au paiement sécurisé · votre crédit
        n&apos;expire jamais.
      </p>

      {erreur && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {erreur}
        </p>
      )}
    </div>
  );
}
