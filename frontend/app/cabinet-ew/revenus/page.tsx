"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";

interface Appel {
  id: string;
  date: string;
  clienteId: string | null;
  cliente: { prenom: string; initiale: string; telephone: string | null };
  formule: string;
  issue: string;
  dureeSecondes: number;
  montant: number;
}

interface ClienteRef {
  id: string;
  solde: number;
}

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function cleMois(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function libelleMois(cle: string): string {
  const [a, m] = cle.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

// Mois précédent d'une clé "2026-08" → "2026-07"
function moisPrecedent(cle: string): string {
  const [a, m] = cle.split("-").map(Number);
  const d = new Date(a, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Export CSV — séparateur ';' et BOM UTF-8 pour Excel FR
function exporterCSV(appels: Appel[], mois: string) {
  const lignes = [
    ["Date", "Heure", "Cliente", "Formule", "Durée (s)", "Issue", "Montant (€)"],
    ...appels.map((a) => {
      const d = new Date(a.date);
      return [
        d.toLocaleDateString("fr-FR"),
        d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        `${a.cliente.prenom} ${a.cliente.initiale}`.trim(),
        a.formule,
        String(a.dureeSecondes || 0),
        a.issue,
        a.montant.toFixed(2).replace(".", ","),
      ];
    }),
  ];
  const csv = lignes
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consultations-${mois}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RevenusPage() {
  const [appels, setAppels] = useState<Appel[]>([]);
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [moisChoisi, setMoisChoisi] = useState("");
  const [provision, setProvision] = useState(25);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    const v = localStorage.getItem("provisionPourcent");
    if (v !== null) setProvision(Number(v));

    Promise.all([api.adminGetAppels(), api.adminGetClientes()])
      .then(([a, c]: [Appel[], ClienteRef[]]) => {
        setAppels(a);
        setClientes(c);
      })
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, []);

  function majProvision(v: number) {
    const borne = Math.min(90, Math.max(0, v || 0));
    setProvision(borne);
    localStorage.setItem("provisionPourcent", String(borne));
  }

  const moisDisponibles = useMemo(() => {
    const set = new Set(appels.map((a) => cleMois(a.date)));
    return [...set].sort().reverse();
  }, [appels]);

  const moisActif = moisChoisi || moisDisponibles[0] || "";

  const encaisse = (mois: string) =>
    appels
      .filter((a) => cleMois(a.date) === mois && a.issue === "terminee")
      .reduce((acc, a) => acc + a.montant, 0);

  const total = useMemo(() => encaisse(moisActif), [appels, moisActif]);
  const totalPrecedent = useMemo(
    () => encaisse(moisPrecedent(moisActif)),
    [appels, moisActif]
  );
  const facturees = appels.filter(
    (a) => cleMois(a.date) === moisActif && a.issue === "terminee"
  );
  const creditEnCirculation = clientes.reduce((acc, c) => acc + (c.solde || 0), 0);
  const lignesDuMois = appels.filter((a) => cleMois(a.date) === moisActif);

  // Évolution vs mois précédent (seulement si ce mois a existé)
  const moisPrecedentExiste = moisDisponibles.includes(moisPrecedent(moisActif));
  const evolution =
    moisPrecedentExiste && totalPrecedent > 0
      ? Math.round(((total - totalPrecedent) / totalPrecedent) * 100)
      : null;

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse) notFound();

  return (
    <CabinetShell>
      <CabinetNav />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">
            Revenus
          </h1>
          {moisActif && (
            <p className="mt-1 text-sm capitalize text-mention">
              {libelleMois(moisActif)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {moisDisponibles.length > 1 && (
            <select
              value={moisActif}
              onChange={(e) => setMoisChoisi(e.target.value)}
              aria-label="Choisir un mois"
              className="rounded-full border border-greige bg-ivory px-4 py-2 text-sm text-ink focus:border-cta-outline focus:outline-none"
            >
              {moisDisponibles.map((m) => (
                <option key={m} value={m}>
                  {libelleMois(m)}
                </option>
              ))}
            </select>
          )}
          {lignesDuMois.length > 0 && (
            <button
              onClick={() => exporterCSV(lignesDuMois, moisActif)}
              title="Télécharger le mois en CSV (pour votre comptabilité)"
              className="whitespace-nowrap rounded-full border border-cta-outline px-4 py-2 text-sm font-medium text-prix transition hover:bg-cta hover:text-cta-text"
            >
              ↓ Export CSV
            </button>
          )}
        </div>
      </div>

      {moisDisponibles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-10 text-center">
          <p className="text-3xl">◈</p>
          <p className="mt-2 text-sm text-mention">
            Aucune consultation facturée pour l&apos;instant.
          </p>
        </div>
      ) : (
        <>
          {/* Ce qui rentre, ce qu'il faut garder, ce qui reste */}
          <section className="mt-5 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">
                  Encaissé
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
                  {euros(total)}
                </p>
                <p className="text-xs text-mention">
                  {facturees.length} consultation
                  {facturees.length > 1 ? "s" : ""} facturée
                  {facturees.length > 1 ? "s" : ""}
                  {evolution !== null && (
                    <>
                      {" · "}
                      <span
                        className={
                          evolution >= 0 ? "font-semibold text-statut-online" : "text-mention"
                        }
                      >
                        {evolution >= 0 ? "+" : ""}
                        {evolution} % vs {libelleMois(moisPrecedent(moisActif)).split(" ")[0]}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">
                  À provisionner
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-amber-700">
                  {euros((total * provision) / 100)}
                </p>
                <label className="mt-1 flex items-center gap-2 text-xs text-mention">
                  Taux
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={provision}
                    onChange={(e) => majProvision(Number(e.target.value))}
                    className="w-14 rounded-lg border border-greige bg-ivory px-2 py-0.5 text-right text-ink focus:border-cta-outline focus:outline-none"
                  />
                  %
                </label>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">
                  Net estimé
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-statut-online">
                  {euros(total * (1 - provision / 100))}
                </p>
                <p className="text-xs text-mention">ce qui vous reste</p>
              </div>
            </div>
          </section>

          {/* Argent déposé, pas encore consommé */}
          {creditEnCirculation > 0 && (
            <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-mention">
                    Crédit en circulation
                  </p>
                  <p className="mt-0.5 text-xs text-mention">
                    Encaissé mais pas encore consommé — vos clientes ont déposé
                    cet argent sans l&apos;avoir encore utilisé.
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {euros(creditEnCirculation)}
                </p>
              </div>
            </section>
          )}

          <p className="mt-4 text-xs text-mention">
            Le détail appel par appel se trouve dans le{" "}
            <a href="/cabinet-ew/journal" className="text-prix hover:underline">
              journal
            </a>
            . Le taux de provision est un réglage personnel, conservé sur cet
            appareil.
          </p>
        </>
      )}
    </CabinetShell>
  );
}
