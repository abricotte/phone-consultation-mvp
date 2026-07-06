"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Statut {
  enLigne: boolean;
  enLigneDepuis: string | null;
  autoOffHeures: number;
}

interface Jour {
  appelsDuJour: number;
  appelsTermines: number;
  appelsActifs: number;
  dureeTotaleMinutes: number;
  revenusJour: number;
  soldesClientsTotal: number;
  nombreWallets: number;
}

function euros(n: number) {
  return n % 1 === 0 ? `${n} €` : `${n.toFixed(2).replace(".", ",")} €`;
}

export default function AdminPage() {
  const [statut, setStatut] = useState<Statut | null>(null);
  const [jour, setJour] = useState<Jour | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    Promise.all([api.adminGetStatut(), api.adminGetJour()])
      .then(([s, j]) => {
        setStatut(s);
        setJour(j);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Accès refusé ou erreur serveur"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle() {
    if (!statut) return;
    setToggling(true);
    setError("");
    try {
      const nouveau = await api.adminSetStatut(!statut.enLigne);
      setStatut((prev) =>
        prev ? { ...prev, ...nouveau } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setToggling(false);
    }
  }

  if (loading)
    return <div className="mt-16 text-center text-ink/60">Chargement…</div>;

  if (error && !statut)
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-greige/70 bg-ivory p-8 text-center">
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-ink/60">
          Cet espace est réservé à la praticienne.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-serif text-3xl font-semibold text-aubergine">
        Espace praticienne
      </h1>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* ===== Toggle en ligne / hors ligne ===== */}
      <div className="mt-8 rounded-2xl border border-greige/70 bg-ivory p-8 text-center shadow-soft">
        <div className="mb-4 flex justify-center">
          {statut?.enLigne ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              Vous êtes EN LIGNE
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-sm font-medium text-ink/60">
              <span className="h-2.5 w-2.5 rounded-full bg-ink/30" />
              Vous êtes hors ligne
            </span>
          )}
        </div>

        {statut?.enLigne && statut.enLigneDepuis && (
          <p className="mb-4 text-sm text-ink/60">
            En ligne depuis{" "}
            {new Date(statut.enLigneDepuis).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · passage automatique hors ligne après {statut.autoOffHeures} h
          </p>
        )}

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`rounded-full px-10 py-4 text-lg font-medium text-white shadow-card transition disabled:opacity-50 ${
            statut?.enLigne
              ? "bg-ink/70 hover:bg-ink"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {toggling
            ? "Mise à jour…"
            : statut?.enLigne
            ? "Passer hors ligne"
            : "Passer en ligne"}
        </button>

        <p className="mt-4 text-xs text-ink/50">
          En ligne : les clientes voient « Elena est en ligne » et peuvent
          lancer une Consultation Immédiate.
        </p>
      </div>

      {/* ===== Vue du jour ===== */}
      <h2 className="mt-10 font-serif text-2xl font-semibold text-aubergine">
        Aujourd&apos;hui
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Appels", valeur: `${jour?.appelsDuJour ?? 0}` },
          {
            label: "Durée totale",
            valeur: `${jour?.dureeTotaleMinutes ?? 0} min`,
          },
          { label: "Revenus du jour", valeur: euros(jour?.revenusJour ?? 0) },
          {
            label: `Soldes clientes (${jour?.nombreWallets ?? 0} portefeuilles)`,
            valeur: euros(jour?.soldesClientsTotal ?? 0),
          },
        ].map((carte) => (
          <div
            key={carte.label}
            className="rounded-2xl border border-greige/60 bg-ivory p-5 text-center"
          >
            <p className="font-serif text-3xl font-semibold text-coral">
              {carte.valeur}
            </p>
            <p className="mt-1 text-xs text-ink/60">{carte.label}</p>
          </div>
        ))}
      </div>

      {jour && jour.appelsActifs > 0 && (
        <p className="mt-4 text-sm font-medium text-green-700">
          📞 {jour.appelsActifs} appel{jour.appelsActifs > 1 ? "s" : ""} en
          cours
        </p>
      )}
    </div>
  );
}
