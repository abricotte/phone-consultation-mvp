"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceNav from "@/components/EspaceNav";

interface Consultation {
  id: string;
  status: string;
  type: string;
  formule: string;
  forfaitMinutes: number | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  montant: number | null;
  createdAt: string;
}

function formatDuree(secondes: number | null): string {
  if (!secondes || secondes <= 0) return "—";
  const min = Math.floor(secondes / 60);
  const sec = secondes % 60;
  if (min === 0) return `${sec} s`;
  return sec > 0 ? `${min} min ${sec.toString().padStart(2, "0")}` : `${min} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    api
      .getSessionHistory()
      .then((data: Consultation[]) => setConsultations(data))
      .catch((err) => {
        if (err instanceof Error && err.message.includes("Token")) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        setErreur(
          err instanceof Error ? err.message : "Impossible de charger l'historique"
        );
      })
      .finally(() => setChargement(false));
  }, []);

  // On n'affiche que les consultations réellement tenues (avec une durée).
  const tenues = consultations.filter(
    (c) => c.status === "completed" && (c.durationSeconds ?? 0) > 0
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 font-jakarta">
      <EspaceNav />

      <h1 className="mt-8 font-serif text-3xl font-semibold text-aubergine">
        Mes consultations
      </h1>
      <p className="mt-2 text-sm text-mention">
        L&apos;historique de vos consultations avec Elena. Pour le détail de vos
        recharges et débits, consultez l&apos;historique des transactions dans
        votre espace.
      </p>

      {chargement && (
        <p className="mt-10 text-center text-mention">Chargement…</p>
      )}

      {erreur && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {erreur}
        </p>
      )}

      {!chargement && !erreur && tenues.length === 0 && (
        <div className="mt-8 rounded-2xl border border-greige/60 bg-ivory p-8 text-center shadow-soft">
          <p className="text-ink">Vous n&apos;avez pas encore de consultation.</p>
          <a
            href="/dashboard"
            className="mt-4 inline-block rounded-full bg-cta px-6 py-3 font-medium text-cta-text hover:bg-cta-dark"
          >
            Appeler Elena
          </a>
        </div>
      )}

      {!chargement && !erreur && tenues.length > 0 && (
        <div className="mt-8 space-y-3">
          {tenues.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-greige/60 bg-ivory p-5 shadow-soft"
            >
              <div>
                <p className="font-serif text-lg font-semibold text-aubergine">
                  {c.formule}
                </p>
                <p className="mt-0.5 text-sm text-mention">
                  {formatDate(c.startedAt || c.createdAt)}
                </p>
                <p className="mt-1 text-sm text-ink">
                  Durée : {formatDuree(c.durationSeconds)}
                </p>
              </div>
              <div className="text-right">
                <span className="font-serif text-xl font-semibold text-prix">
                  {c.montant != null ? `${c.montant.toFixed(2)}€` : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
