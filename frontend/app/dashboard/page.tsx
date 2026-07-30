"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import HeroConsultation from "@/components/HeroConsultation";
import EspaceNav from "@/components/EspaceNav";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Wallet {
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

// Pensée du jour — une par jour, en douceur (rotation déterministe)
const PENSEES = [
  "Rien ne meurt, tout se transforme.",
  "Ce qui est écrit trouve toujours son chemin.",
  "Écoutez votre intuition : elle parle avant les mots.",
  "Chaque rencontre laisse une empreinte dans votre ciel.",
  "La patience est une forme de confiance en l'avenir.",
  "Les réponses viennent à celles qui savent attendre.",
  "Votre lumière ne demande qu'à être vue.",
];

function jourDeLAnnee(d: Date): number {
  const debut = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - debut.getTime()) / 86400000);
}

// "58,00 €" à la française
function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prixMinuteCents, setPrixMinuteCents] = useState(290);
  const [minimumMinutes, setMinimumMinutes] = useState(5);
  const [suggestionsMinutes, setSuggestionsMinutes] = useState<number[]>([10, 20, 30]);
  const [minMinutes, setMinMinutes] = useState(5);
  const [maxMinutes, setMaxMinutes] = useState(90);
  const [pasMinutes, setPasMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("");

  // Calculés après montage (pas de décalage d'hydratation)
  const [dateDuJour, setDateDuJour] = useState("");
  const [pensee, setPensee] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const maintenant = new Date();
    setDateDuJour(
      maintenant.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
    setPensee(PENSEES[jourDeLAnnee(maintenant) % PENSEES.length]);

    // Vérifier le retour de Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentStatus("Paiement effectué avec succès ! Votre solde sera mis à jour sous peu.");
      window.history.replaceState({}, "", "/dashboard");
    } else if (params.get("payment") === "cancel") {
      setPaymentStatus("Paiement annulé.");
      window.history.replaceState({}, "", "/dashboard");
    }

    api
      .getRechargeConfig()
      .then(
        (c: {
          prixMinuteCents: number;
          creditMinimumMinutes: number;
          suggestionsMinutes: number[];
          minMinutes: number;
          maxMinutes: number;
          pasMinutes: number;
        }) => {
          if (c?.prixMinuteCents) setPrixMinuteCents(c.prixMinuteCents);
          if (c?.creditMinimumMinutes) setMinimumMinutes(c.creditMinimumMinutes);
          if (c?.suggestionsMinutes?.length) setSuggestionsMinutes(c.suggestionsMinutes);
          if (c?.minMinutes) setMinMinutes(c.minMinutes);
          if (c?.maxMinutes) setMaxMinutes(c.maxMinutes);
          if (c?.pasMinutes) setPasMinutes(c.pasMinutes);
        }
      )
      .catch(() => {
        /* les valeurs par défaut restent affichées */
      });

    Promise.all([api.getMe(), api.getWallet(), api.getTransactions()])
      .then(([userData, walletData, txData]) => {
        setUser(userData);
        setWallet(walletData);
        setTransactions(txData);
      })
      .catch((err) => {
        setError(err.message);
        if (err.message.includes("Token")) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const balance = wallet?.balance ?? 0;
  const minutesRestantes = Math.floor((balance * 100) / prixMinuteCents);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (error && !user)
    return <div className="mt-16 text-center text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 font-jakarta">
      <EspaceNav />

      {/* Salutation */}
      <header className="relative mt-10 mb-8">
        <span aria-hidden className="pointer-events-none absolute right-2 top-0 text-lg text-gold/50">✦</span>
        <span aria-hidden className="pointer-events-none absolute right-14 top-8 text-[0.6rem] text-coral/40">✦</span>

        {dateDuJour && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
            {dateDuJour}
          </p>
        )}
        <h1 className="mt-1.5 font-serif text-4xl font-semibold text-aubergine sm:text-5xl">
          Bonjour {user?.firstName}
        </h1>
        {pensee && (
          <p className="mt-2 font-serif text-lg italic text-mention/90">
            « {pensee} »
          </p>
        )}
      </header>

      {paymentStatus && (
        <div className={`mb-6 rounded-2xl p-4 ${paymentStatus.includes("succès") ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
          {paymentStatus}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* LE geste direct : appeler / recharger (tout centralisé ici) */}
      <div className="mb-6">
        <HeroConsultation
          soldeMinutes={minutesRestantes}
          minimumMinutes={minimumMinutes}
          prixMinuteCents={prixMinuteCents}
          suggestionsMinutes={suggestionsMinutes}
          minMinutes={minMinutes}
          maxMinutes={maxMinutes}
          pasMinutes={pasMinutes}
        />
      </div>

      {/* Historique des transactions */}
      <section className="rounded-3xl border border-greige/40 bg-ivory p-7 shadow-soft sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-aubergine">
          Recharges &amp; débits
        </h2>
        {transactions.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-8 text-center">
            <p className="text-3xl">✦</p>
            <p className="mt-2 text-sm text-mention">
              Aucune transaction pour le moment.
            </p>
          </div>
        ) : (
          <ul className="mt-4">
            {transactions.map((tx) => {
              const credit = tx.type === "credit";
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3.5 border-b border-greige/40 py-3.5 last:border-0"
                >
                  <span
                    aria-hidden
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-medium ${
                      credit
                        ? "bg-green-50 text-statut-online"
                        : "bg-blush text-prix"
                    }`}
                  >
                    {credit ? "＋" : "☾"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {tx.description}
                    </p>
                    <p className="text-xs text-mention">
                      {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-base font-bold tabular-nums tracking-tight ${
                      credit ? "text-statut-online" : "text-aubergine"
                    }`}
                  >
                    {credit ? "+" : "−"}
                    {euros(tx.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
