"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { capitaliser } from "@/lib/format";
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
        // Espace réservé aux clientes : la praticienne va dans son cabinet
        if (userData.role === "consultant" || userData.role === "admin") {
          window.location.replace("/cabinet-ew");
          return;
        }
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

  // Le chemin ne montre que les consultations — les recharges sont de
  // l'intendance, elles vivent dans l'onglet Compte.
  const consultationsPassees = transactions.filter((tx) => tx.type === "debit");

  // « Votre dernière consultation : il y a 12 jours » — une existence
  // douce du temps qui passe, sans injonction. Prépare les jalons
  // (« notre 12e consultation ensemble ») sans les précéder.
  function depuisDerniere(): string | null {
    if (consultationsPassees.length === 0) return null;
    const jours = Math.floor(
      (Date.now() - new Date(consultationsPassees[0].createdAt).getTime()) /
        86_400_000
    );
    if (jours <= 0) return "aujourd'hui";
    if (jours === 1) return "hier";
    return `il y a ${jours} jours`;
  }

  // « 20 minutes avec Elena » plutôt que « −5,80 € » : la monnaie de cet
  // espace est le temps passé ensemble, pas l'euro.
  function minutesDeConsultation(description: string): string {
    const m = description.match(/(\d+)\s*min/);
    if (m) {
      const n = Number(m[1]);
      return `${n} minute${n > 1 ? "s" : ""} avec Elena`;
    }
    return description;
  }

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
          Bonjour {capitaliser(user?.firstName)}
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

      {/* MON CHEMIN AVEC ELENA — le renversement voulu par Elena :
          « l'argent en coulisse, le cheminement en scène ». Ici, une
          consultation est un moment passé ensemble, pas une dépense. Les
          montants en euros vivent dans l'onglet Compte, à leur place. */}
      <section className="rounded-3xl border border-greige/40 bg-ivory p-7 shadow-soft sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-aubergine">
          Mon chemin avec Elena
        </h2>
        {consultationsPassees.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-8 text-center">
            <p className="text-3xl">✦</p>
            <p className="mt-2 text-sm text-mention">
              Votre chemin commencera à votre première consultation.
            </p>
          </div>
        ) : (
          <ul className="mt-4">
            {/* Trois entrées seulement : l'accueil donne le fil, l'onglet
                Consultations garde l'histoire complète. Deux listes
                longues au même endroit se font concurrence. */}
            {consultationsPassees.slice(0, 3).map((tx) => (
              <li
                key={tx.id}
                className="flex items-center gap-3.5 border-b border-greige/40 py-3.5 last:border-0"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush text-lg font-medium text-prix"
                >
                  ☾
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {minutesDeConsultation(tx.description)}
                  </p>
                  <p className="text-xs text-mention">
                    {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {consultationsPassees.length > 3 && (
          <a
            href="/consultations"
            className="mt-3 inline-block text-sm font-bold text-prix hover:underline"
          >
            Voir toutes mes consultations →
          </a>
        )}
        <p className="mt-4 text-xs text-mention">
          {depuisDerniere() && (
            <>Votre dernière consultation : {depuisDerniere()} · </>
          )}
          Le détail de vos recharges se trouve dans{" "}
          <a href="/credit" className="underline hover:text-aubergine">
            Mon crédit
          </a>
          .
        </p>
      </section>
    </div>
  );
}
