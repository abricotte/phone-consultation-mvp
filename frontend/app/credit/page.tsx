"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import EspaceNav from "@/components/EspaceNav";
import BlocRecharge from "@/components/BlocRecharge";

// MON CRÉDIT — l'argent a désormais sa page.
//
// Il vivait au bas de « Mon compte », coincé entre l'adresse email et le
// mot de passe : impossible de s'y retrouver, et sans rapport avec le
// reste de la page. Ailleurs dans l'espace, une consultation est un
// moment (« 20 minutes avec Elena ») ; ici, et ici seulement, elle est
// une somme. C'est le registre de cette page, assumé.
//
// Trois choses qu'une cliente vient y chercher, dans cet ordre :
//   1. « Combien me reste-t-il ? »  → le solde, en haut, en grand
//   2. « Où est passé mon argent ? » → l'historique, groupé par mois
//   3. « Combien ai-je dépensé en tout ? » → le récapitulatif, en bas

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  createdAt: string;
}

interface Wallet {
  balance: number;
}

const euros = (n: number) => Number(n).toFixed(2).replace(".", ",") + " €";

/** « Août 2026 » — clé de regroupement ET titre affiché */
function moisDe(iso: string): string {
  const m = new Date(iso).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return m.charAt(0).toUpperCase() + m.slice(1);
}

function jourDe(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function heureDe(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreditPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [solde, setSolde] = useState<number | null>(null);
  const [prixMinute, setPrixMinute] = useState(2.9);

  // La recharge vit ICI, et seulement ici. « L'accueil décide, l'écran
  // suivant exécute » (Elena) : le tableau de bord n'a plus que le lien.
  const [config, setConfig] = useState<{
    prixMinuteCents: number;
    creditMinimumMinutes: number;
    suggestionsMinutes: number[];
    minMinutes: number;
    maxMinutes: number;
    pasMinutes: number;
  } | null>(null);

  // « Appeler maintenant » avec un crédit insuffisant mène ici, avec la
  // raison en toutes lettres — la cliente ne doit jamais se demander
  // pourquoi elle a atterri sur une page d'argent.
  const [pourAppeler, setPourAppeler] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    setPourAppeler(
      new URLSearchParams(window.location.search).get("pour") === "appeler"
    );

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    Promise.all([
      api.getWallet().catch(() => null),
      api.getTransactions().catch(() => []),
      api.getRechargeConfig().catch(() => null),
    ])
      .then(([w, t, c]) => {
        setSolde((w as Wallet | null)?.balance ?? null);
        setTransactions((t as Transaction[]) || []);
        const cfg = c as {
          prixMinuteCents?: number;
          creditMinimumMinutes?: number;
          suggestionsMinutes?: number[];
          minMinutes?: number;
          maxMinutes?: number;
          pasMinutes?: number;
        } | null;
        if (cfg?.prixMinuteCents) {
          setPrixMinute(cfg.prixMinuteCents / 100);
          setConfig({
            prixMinuteCents: cfg.prixMinuteCents,
            creditMinimumMinutes: cfg.creditMinimumMinutes ?? 5,
            suggestionsMinutes: cfg.suggestionsMinutes?.length
              ? cfg.suggestionsMinutes
              : [10, 20, 30],
            minMinutes: cfg.minMinutes ?? 5,
            maxMinutes: cfg.maxMinutes ?? 90,
            pasMinutes: cfg.pasMinutes ?? 5,
          });
        }
      })
      .finally(() => setChargement(false));
  }, []);

  // Groupement par mois : une liste plate de trente lignes ne se lit
  // pas. Les mois donnent des repères, et l'ordre reste antéchronologique.
  const parMois = useMemo(() => {
    const groupes = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const cle = moisDe(t.createdAt);
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle)!.push(t);
    }
    return [...groupes.entries()];
  }, [transactions]);

  const totalRecharge = transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalUtilise = transactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Number(t.amount), 0);

  const soldeMinutes =
    solde !== null && prixMinute > 0 ? Math.floor(solde / prixMinute) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <EspaceNav />
      </div>

      <h1 className="mt-8 font-serif text-3xl font-semibold text-aubergine">
        Mon crédit
      </h1>
      <p className="mt-1 text-sm text-mention">
        Vos recharges et le détail de ce qui a été utilisé.
      </p>

      {/* 1. COMBIEN ME RESTE-T-IL — la première question, en grand.
             « n'expire jamais » y est accolé : c'est la promesse qui
             distingue cet espace des plateformes, elle se lit avec le
             chiffre, pas dans une note de bas de page. */}
      <div className="mt-6 rounded-3xl border border-greige/60 bg-gradient-to-br from-blush via-cream to-cream p-7 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-mention">
          Il vous reste
        </p>
        {chargement ? (
          <p className="mt-2 text-2xl text-mention">…</p>
        ) : (
          <>
            <p className="mt-1 font-serif text-4xl font-semibold text-aubergine">
              {soldeMinutes !== null ? `${soldeMinutes} min` : "—"}
              {solde !== null && (
                <span className="ml-3 text-xl font-normal text-mention">
                  {euros(solde)}
                </span>
              )}
            </p>
            <p className="mt-2 text-sm text-ink/70">
              ☾ Votre crédit n&apos;expire jamais.
            </p>
          </>
        )}
      </div>

      {/* Venue depuis « Appeler maintenant » : la raison en toutes
          lettres, avant les montants. */}
      {pourAppeler && soldeMinutes !== null && config && (
        <p className="mt-4 rounded-2xl bg-gold/10 px-5 py-3.5 text-sm text-gold-dark ring-1 ring-gold/30">
          Il vous reste <strong>{soldeMinutes} min</strong> — il en faut au
          moins <strong>{config.creditMinimumMinutes}</strong> pour appeler.
          Rechargez ci-dessous, puis retournez sur{" "}
          <a href="/dashboard" className="underline">
            votre espace
          </a>{" "}
          pour lancer l&apos;appel.
        </p>
      )}

      {/* LA RECHARGE — paliers + curseur. Elle vit ici, et seulement ici. */}
      {config && (
        <div className="mt-6 rounded-3xl border border-greige/60 bg-ivory p-6 shadow-soft sm:p-7">
          <BlocRecharge
            prixMinuteCents={config.prixMinuteCents}
            suggestionsMinutes={config.suggestionsMinutes}
            minMinutes={config.minMinutes}
            maxMinutes={config.maxMinutes}
            pasMinutes={config.pasMinutes}
          />
        </div>
      )}

      {/* 2. OÙ EST PASSÉ MON ARGENT — l'historique, groupé par mois */}
      {!chargement && transactions.length === 0 && (
        <div className="mt-6 rounded-2xl border border-greige/60 bg-ivory p-8 text-center shadow-soft">
          <p className="text-ink">Aucun mouvement pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-mention">
            Vos recharges et consultations apparaîtront ici.
          </p>
        </div>
      )}

      {parMois.map(([mois, lignes]) => (
        <div
          key={mois}
          className="mt-6 rounded-2xl border border-greige/60 bg-ivory p-6 shadow-soft"
        >
          <h2 className="font-serif text-lg font-semibold text-aubergine">
            {mois}
          </h2>
          <ul className="mt-3">
            {lignes.map((tx) => {
              const credit = tx.type === "credit";
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 border-b border-greige/40 py-3 last:border-0"
                >
                  {/* Un signe visuel avant le texte : on distingue une
                      entrée d'une sortie sans lire le montant. */}
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                      credit
                        ? "bg-green-50 text-statut-online"
                        : "bg-blush text-aubergine"
                    }`}
                  >
                    {credit ? "+" : "☾"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {tx.description}
                    </p>
                    <p className="text-xs text-mention">
                      {jourDe(tx.createdAt)} à {heureDe(tx.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
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
        </div>
      ))}

      {/* 3. COMBIEN EN TOUT — discret, en pied. Une information de
             contrôle, pas un jugement : aucun commentaire sur le
             montant, aucune comparaison, aucun encouragement à dépenser. */}
      {transactions.length > 0 && (
        <p className="mt-6 text-center text-xs text-mention">
          Depuis votre inscription : {euros(totalRecharge)} rechargés ·{" "}
          {euros(totalUtilise)} utilisés en consultations.
        </p>
      )}
    </div>
  );
}
