"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Config = {
  prixMinuteCents: number;
  creditMinimumMinutes: number;
  suggestionsMinutes: number[];
  defautMinutes: number;
  pasMinutes: number;
  minMinutes: number;
  maxMinutes: number;
};

// Valeurs d'affichage initiales, remplacées par la config praticienne dès chargement
const CONFIG_INITIALE: Config = {
  prixMinuteCents: 290,
  creditMinimumMinutes: 5,
  suggestionsMinutes: [10, 20, 30],
  defautMinutes: 20,
  pasMinutes: 5,
  minMinutes: 5,
  maxMinutes: 60,
};

// Prix formaté à la française : "58 €" ou "14,50 €"
function prix(minutes: number, prixMinuteCents: number) {
  const totalCents = minutes * prixMinuteCents;
  return totalCents % 100 === 0
    ? `${totalCents / 100} €`
    : `${(totalCents / 100).toFixed(2).replace(".", ",")} €`;
}

export default function RechargeSelector() {
  const [config, setConfig] = useState<Config>(CONFIG_INITIALE);
  const [minutes, setMinutes] = useState(CONFIG_INITIALE.defautMinutes);
  const [autreDuree, setAutreDuree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getRechargeConfig()
      .then((c: Config) => {
        setConfig(c);
        setMinutes(c.defautMinutes);
      })
      .catch(() => {
        /* la config initiale reste affichée */
      });
  }, []);

  async function handleRecharge() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.topUp(minutes);
      if (data.url) {
        window.location.href = data.url; // Stripe Checkout
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  const durees: number[] = [];
  for (let m = config.minMinutes; m <= config.maxMinutes; m += config.pasMinutes) {
    durees.push(m);
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-5 text-center font-serif text-xl font-semibold text-aubergine">
        Combien de temps souhaitez-vous ?
      </p>

      {/* Suggestions — minutes d'abord, euros ensuite */}
      <div className="grid grid-cols-3 gap-3">
        {config.suggestionsMinutes.map((m) => {
          const actif = minutes === m && !autreDuree;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMinutes(m);
                setAutreDuree(false);
              }}
              className={`rounded-2xl border p-4 text-center transition ${
                actif
                  ? "border-cta bg-ivory shadow-card"
                  : "border-greige/70 bg-ivory/60 hover:border-coral/50"
              }`}
            >
              <span className="block font-serif text-2xl font-semibold text-aubergine">
                {m} min
              </span>
              <span className="text-sm text-ink/60">
                {prix(m, config.prixMinuteCents)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Autre durée : pas de 5 minutes, prix en temps réel */}
      <div className="mt-4 text-center">
        {!autreDuree ? (
          <button
            type="button"
            onClick={() => setAutreDuree(true)}
            className="text-sm font-medium text-coral hover:underline"
          >
            Autre durée
          </button>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="rounded-lg border border-greige bg-ivory px-3 py-2 text-aubergine"
            >
              {durees.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
            <span className="font-serif text-2xl font-semibold text-prix">
              {prix(minutes, config.prixMinuteCents)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleRecharge}
        disabled={loading}
        className="mt-6 block w-full rounded-full bg-cta px-6 py-3.5 text-center font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
      >
        {loading
          ? "Redirection vers le paiement…"
          : `Recharger ${minutes} min — ${prix(minutes, config.prixMinuteCents)}`}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-ink/55">
        Crédit minimum pour appeler : {config.creditMinimumMinutes} min (
        {prix(config.creditMinimumMinutes, config.prixMinuteCents)}) · Toute
        minute entamée est due · Votre crédit n&apos;expire jamais.
      </p>
    </div>
  );
}
