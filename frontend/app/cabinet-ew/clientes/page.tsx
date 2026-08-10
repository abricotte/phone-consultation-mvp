"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";

interface Cliente {
  id: string;
  prenom: string;
  initiale: string;
  inscriteLe: string;
  solde: number;
  nbConsultations: number;
  derniereConsultation: string | null;
}

// Teintes douces pour les avatars (cycle par index, comme les proches)
const TEINTES = [
  "bg-coral/15 text-coral-dark",
  "bg-gold/20 text-gold-dark",
  "bg-aubergine/10 text-aubergine",
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    api
      .adminGetClientes()
      .then((data: Cliente[]) => setClientes(data))
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse) notFound();

  const filtre = recherche.trim().toLowerCase();
  const visibles = filtre
    ? clientes.filter((c) =>
        `${c.prenom} ${c.initiale}`.toLowerCase().includes(filtre)
      )
    : clientes;

  return (
    <CabinetShell>
      <CabinetNav />

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-aubergine">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-mention">
            {clientes.length} cliente{clientes.length > 1 ? "s" : ""} — cliquez
            sur une fiche pour préparer votre lecture.
          </p>
        </div>
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un prénom…"
          className="rounded-full border border-greige bg-ivory px-4 py-2 text-sm text-ink focus:border-cta-outline focus:outline-none"
        />
      </div>

      {visibles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-10 text-center">
          <p className="text-3xl">✧</p>
          <p className="mt-2 text-sm text-mention">
            {filtre ? "Aucune cliente ne correspond." : "Aucune cliente pour le moment."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {visibles.map((c, i) => (
            <li key={c.id}>
              <a
                href={`/cabinet-ew/clientes/${c.id}`}
                className="flex items-center gap-4 rounded-2xl border border-greige/50 bg-ivory px-5 py-3.5 shadow-soft transition hover:-translate-y-0.5 hover:border-cta/40"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold ${
                    TEINTES[i % TEINTES.length]
                  }`}
                >
                  {c.prenom.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {c.prenom} {c.initiale}
                  </span>
                  <span className="block text-xs text-mention">
                    {c.nbConsultations} consultation
                    {c.nbConsultations > 1 ? "s" : ""}
                    {c.derniereConsultation &&
                      ` · dernière le ${formatDate(c.derniereConsultation)}`}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold tabular-nums text-aubergine">
                    {euros(c.solde)}
                  </span>
                  <span className="block text-xs text-mention">de crédit</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </CabinetShell>
  );
}
