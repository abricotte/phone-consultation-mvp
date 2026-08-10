"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";

interface Cliente {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  inscriteLe: string;
  solde: number;
  nbConsultations: number;
  derniereConsultation: string | null;
  totalDepense: number;
}

const TEINTES = [
  "bg-coral/15 text-coral-dark",
  "bg-gold/20 text-gold-dark",
  "bg-aubergine/10 text-aubergine",
];

const TRIS = [
  { code: "recentes", label: "Dernière consultation" },
  { code: "depense", label: "Total dépensé" },
  { code: "consultations", label: "Nombre de consultations" },
  { code: "solde", label: "Crédit restant" },
  { code: "alpha", label: "Prénom (A→Z)" },
  { code: "inscription", label: "Date d'inscription" },
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

// +33612345678 → 06 12 34 56 78 (plus lisible pour composer)
function formatTel(t: string | null): string {
  if (!t) return "—";
  const fr = t.replace(/^\+33/, "0");
  return /^0\d{9}$/.test(fr) ? fr.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : t;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState("recentes");
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

  const visibles = useMemo(() => {
    const f = recherche.trim().toLowerCase();
    const filtrees = f
      ? clientes.filter((c) =>
          `${c.prenom} ${c.nom} ${c.email ?? ""} ${c.telephone ?? ""}`
            .toLowerCase()
            .includes(f)
        )
      : [...clientes];

    const parDate = (v: string | null) => (v ? new Date(v).getTime() : 0);

    switch (tri) {
      case "depense":
        return filtrees.sort((a, b) => b.totalDepense - a.totalDepense);
      case "consultations":
        return filtrees.sort((a, b) => b.nbConsultations - a.nbConsultations);
      case "solde":
        return filtrees.sort((a, b) => b.solde - a.solde);
      case "alpha":
        return filtrees.sort((a, b) =>
          a.prenom.localeCompare(b.prenom, "fr", { sensitivity: "base" })
        );
      case "inscription":
        return filtrees.sort((a, b) => parDate(b.inscriteLe) - parDate(a.inscriteLe));
      default:
        return filtrees.sort(
          (a, b) => parDate(b.derniereConsultation) - parDate(a.derniereConsultation)
        );
    }
  }, [clientes, recherche, tri]);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse) notFound();

  const chiffreAffaires = clientes.reduce((acc, c) => acc + c.totalDepense, 0);

  return (
    <CabinetShell>
      <CabinetNav />

      <div className="mt-8">
        <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">
          Mes clientes
        </h1>
        <p className="mt-1 text-sm text-mention">
          {clientes.length} cliente{clientes.length > 1 ? "s" : ""} ·{" "}
          <span className="font-semibold text-aubergine">
            {euros(chiffreAffaires)}
          </span>{" "}
          de consultations depuis l&apos;ouverture
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un prénom, un email, un numéro…"
          className="min-w-64 flex-1 rounded-full border border-greige bg-ivory px-4 py-2 text-sm text-ink focus:border-cta-outline focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-mention">
          Trier par
          <select
            value={tri}
            onChange={(e) => setTri(e.target.value)}
            className="rounded-full border border-greige bg-ivory px-3 py-2 text-sm text-ink focus:border-cta-outline focus:outline-none"
          >
            {TRIS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-10 text-center">
          <p className="text-3xl">✧</p>
          <p className="mt-2 text-sm text-mention">
            {recherche
              ? "Aucune cliente ne correspond."
              : "Aucune cliente pour le moment."}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {visibles.map((c, i) => (
            <li key={c.id}>
              <a
                href={`/cabinet-ew/clientes/${c.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-greige/50 bg-ivory px-5 py-4 shadow-soft transition hover:-translate-y-0.5 hover:border-cta/40"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                    TEINTES[i % TEINTES.length]
                  }`}
                >
                  {c.prenom.charAt(0).toUpperCase()}
                </span>

                <span className="min-w-44 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {c.prenom} {c.nom}
                  </span>
                  <span className="block truncate text-xs text-mention">
                    {formatTel(c.telephone)}
                    {c.email && ` · ${c.email}`}
                  </span>
                </span>

                <span className="w-28 shrink-0">
                  <span className="block text-sm text-ink">
                    {c.nbConsultations} consult.
                  </span>
                  <span className="block text-xs text-mention">
                    {c.derniereConsultation
                      ? formatDate(c.derniereConsultation)
                      : "jamais"}
                  </span>
                </span>

                <span className="w-24 shrink-0 text-right">
                  <span className="block font-bold tabular-nums text-aubergine">
                    {euros(c.totalDepense)}
                  </span>
                  <span className="block text-xs text-mention">dépensés</span>
                </span>

                <span className="w-24 shrink-0 text-right">
                  <span
                    className={`block font-bold tabular-nums ${
                      c.solde > 0 ? "text-statut-online" : "text-mention"
                    }`}
                  >
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
