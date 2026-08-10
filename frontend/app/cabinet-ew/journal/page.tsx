"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";

interface Appel {
  id: string;
  date: string;
  clienteId: string | null;
  cliente: { prenom: string; initiale: string };
  formule: string;
  issue: string;
  dureeSecondes: number;
  montant: number;
}

function formatDuree(s: number): string {
  if (!s || s <= 0) return "—";
  const min = Math.floor(s / 60);
  const sec = s % 60;
  if (min === 0) return `${sec} s`;
  return sec > 0 ? `${min} min ${sec.toString().padStart(2, "0")}` : `${min} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

const ISSUES: Record<string, { label: string; classes: string }> = {
  terminee: { label: "Terminé", classes: "bg-green-50 text-statut-online" },
  non_facturee: { label: "Non facturé (< 1 min)", classes: "bg-blush text-mention" },
  manquee: { label: "Manqué", classes: "bg-amber-50 text-amber-700" },
  en_cours: { label: "En cours", classes: "bg-green-50 text-statut-online" },
  failed: { label: "Échec", classes: "bg-red-50 text-red-600" },
  refunded: { label: "Recréditée", classes: "bg-blush text-mention" },
};

export default function JournalPage() {
  const [appels, setAppels] = useState<Appel[]>([]);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // La porte d'entrée du cabinet gère la connexion
      window.location.replace("/cabinet-ew");
      return;
    }
    api
      .adminGetAppels()
      .then((data: Appel[]) => setAppels(data))
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 font-jakarta">
      <CabinetNav />

      <h1 className="mt-8 font-serif text-3xl font-semibold text-aubergine">
        Journal des appels
      </h1>
      <p className="mt-1 text-sm text-mention">
        Les 50 derniers appels, tous types confondus.
      </p>

      {appels.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-10 text-center">
          <p className="text-3xl">☾</p>
          <p className="mt-2 text-sm text-mention">Aucun appel pour le moment.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {appels.map((a) => {
            const issue = ISSUES[a.issue] || {
              label: a.issue,
              classes: "bg-blush text-mention",
            };
            const facture = a.issue === "terminee" && a.montant > 0;
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-greige/50 bg-ivory px-5 py-3.5 shadow-soft"
              >
                <span className="w-32 shrink-0 text-sm text-mention">
                  {formatDate(a.date)}
                </span>
                <span className="min-w-28 font-medium text-ink">
                  {a.clienteId ? (
                    <a
                      href={`/cabinet-ew/clientes/${a.clienteId}`}
                      className="hover:text-cta hover:underline"
                    >
                      {a.cliente.prenom} {a.cliente.initiale}
                    </a>
                  ) : (
                    <span className="text-mention">{a.cliente.prenom}</span>
                  )}
                </span>
                <span className="text-sm text-mention">{a.formule}</span>
                <span className="text-sm text-ink">{formatDuree(a.dureeSecondes)}</span>
                <span className="ml-auto flex items-center gap-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${issue.classes}`}
                  >
                    {issue.label}
                  </span>
                  {facture && (
                    <span className="font-bold tabular-nums text-aubergine">
                      {euros(a.montant)}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
