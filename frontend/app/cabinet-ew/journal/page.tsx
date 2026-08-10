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

function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

// Clé de regroupement : le jour civil, en heure locale
function cleJour(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function cleMois(iso: string): string {
  return cleJour(iso).slice(0, 7);
}

function libelleJour(cle: string): string {
  const [a, m, j] = cle.split("-").map(Number);
  const d = new Date(a, m - 1, j);
  const today = new Date();
  const hier = new Date();
  hier.setDate(today.getDate() - 1);

  const memeJour = (x: Date, y: Date) =>
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate();

  if (memeJour(d, today)) return "Aujourd'hui";
  if (memeJour(d, hier)) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function libelleMois(cle: string): string {
  const [a, m] = cle.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

const ISSUES: Record<string, { label: string; classes: string }> = {
  terminee: { label: "Terminé", classes: "bg-green-50 text-statut-online" },
  non_facturee: { label: "Non facturé (< 1 min)", classes: "bg-blush text-mention" },
  manquee: { label: "Manqué", classes: "bg-amber-50 text-amber-700" },
  en_cours: { label: "En cours", classes: "bg-green-50 text-statut-online" },
  interrompue: { label: "Interrompue", classes: "bg-greige/50 text-mention" },
  failed: { label: "Échec", classes: "bg-red-50 text-red-600" },
  refunded: { label: "Recréditée", classes: "bg-blush text-mention" },
};

interface ClienteRef {
  id: string;
  inscriteLe: string;
}

export default function JournalPage() {
  const [appels, setAppels] = useState<Appel[]>([]);
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [moisChoisi, setMoisChoisi] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    // Les clientes servent à repérer les NOUVELLES du mois (date d'inscription)
    Promise.all([api.adminGetAppels(), api.adminGetClientes()])
      .then(([a, c]: [Appel[], ClienteRef[]]) => {
        setAppels(a);
        setClientes(c);
      })
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, []);

  // Mois disponibles, du plus récent au plus ancien
  const moisDisponibles = useMemo(() => {
    const set = new Set(appels.map((a) => cleMois(a.date)));
    return [...set].sort().reverse();
  }, [appels]);

  const moisActif = moisChoisi || moisDisponibles[0] || "";

  // Regroupement par jour à l'intérieur du mois affiché
  const jours = useMemo(() => {
    const duMois = appels.filter((a) => cleMois(a.date) === moisActif);
    const parJour = new Map<string, Appel[]>();
    for (const a of duMois) {
      const k = cleJour(a.date);
      if (!parJour.has(k)) parJour.set(k, []);
      parJour.get(k)!.push(a);
    }
    return [...parJour.entries()].sort((x, y) => (x[0] < y[0] ? 1 : -1));
  }, [appels, moisActif]);

  // Indicateurs du mois affiché — réservés à la praticienne
  const stats = useMemo(() => {
    const duMois = appels.filter((a) => cleMois(a.date) === moisActif);
    const tenues = duMois.filter(
      (a) => a.issue === "terminee" || a.issue === "non_facturee"
    );
    const manques = duMois.filter((a) => a.issue === "manquee");
    const facturees = duMois.filter((a) => a.issue === "terminee");

    const total = facturees.reduce((acc, a) => acc + a.montant, 0);
    const secondes = tenues.reduce((acc, a) => acc + a.dureeSecondes, 0);

    // Clientes distinctes ayant appelé ce mois-ci
    const idsDuMois = new Set(
      duMois.map((a) => a.clienteId).filter(Boolean) as string[]
    );
    // Parmi elles, celles inscrites pendant ce même mois
    const inscriptions = new Map(clientes.map((c) => [c.id, c.inscriteLe]));
    const nouvelles = [...idsDuMois].filter((id) => {
      const inscrite = inscriptions.get(id);
      return inscrite ? cleMois(inscrite) === moisActif : false;
    }).length;

    return {
      appels: duMois.length,
      tenues: tenues.length,
      manques: manques.length,
      total,
      minutes: Math.round(secondes / 60),
      panierMoyen: facturees.length ? total / facturees.length : 0,
      clientes: idsDuMois.size,
      nouvelles,
    };
  }, [appels, clientes, moisActif]);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse) notFound();

  return (
    <CabinetShell>
      <CabinetNav />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-aubergine">
            Journal des appels
          </h1>
          {moisActif && (
            <p className="mt-1 text-sm capitalize text-mention">
              {libelleMois(moisActif)}
            </p>
          )}
        </div>

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
      </div>

      {/* Indicateurs du mois — pour toi seule */}
      {stats.appels > 0 && (
        <section className="mt-5 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Encaissé
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {euros(stats.total)}
              </p>
              <p className="text-xs text-mention">
                {euros(stats.panierMoyen)} en moyenne
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Appels reçus
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {stats.appels}
              </p>
              <p className="text-xs text-mention">
                {stats.tenues} tenu{stats.tenues > 1 ? "s" : ""}
                {stats.manques > 0 && (
                  <span className="text-amber-700">
                    {" · "}
                    {stats.manques} manqué{stats.manques > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Clientes
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {stats.clientes}
              </p>
              <p className="text-xs text-mention">
                {stats.nouvelles > 0 ? (
                  <span className="font-medium text-statut-online">
                    ✦ {stats.nouvelles} nouvelle{stats.nouvelles > 1 ? "s" : ""}
                  </span>
                ) : (
                  "aucune nouvelle"
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Temps d&apos;écoute
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {stats.minutes}
                <span className="ml-1 text-base font-normal text-mention">min</span>
              </p>
              <p className="text-xs text-mention">
                {stats.tenues > 0
                  ? `${Math.round(stats.minutes / stats.tenues)} min par appel`
                  : "—"}
              </p>
            </div>
          </div>

          {stats.manques >= 3 && stats.manques > stats.tenues && (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              ⚠️ Plus d&apos;appels manqués que d&apos;appels tenus ce mois-ci —
              pensez à vérifier que votre téléphone est joignable quand vous
              passez en ligne.
            </p>
          )}
        </section>
      )}

      {jours.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-10 text-center">
          <p className="text-3xl">☾</p>
          <p className="mt-2 text-sm text-mention">Aucun appel sur cette période.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          {jours.map(([cle, liste]) => {
            const totalJour = liste
              .filter((a) => a.issue === "terminee")
              .reduce((acc, a) => acc + a.montant, 0);
            const tenues = liste.filter(
              (a) => a.issue === "terminee" || a.issue === "non_facturee"
            ).length;

            return (
              <section key={cle}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-greige/60 pb-1.5">
                  <h2 className="font-serif text-lg font-semibold capitalize text-aubergine">
                    {libelleJour(cle)}
                  </h2>
                  <p className="text-xs text-mention">
                    {liste.length} appel{liste.length > 1 ? "s" : ""}
                    {tenues > 0 && ` · ${tenues} tenue${tenues > 1 ? "s" : ""}`}
                    {totalJour > 0 && (
                      <>
                        {" · "}
                        <span className="font-semibold text-aubergine">
                          {euros(totalJour)}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <ul className="space-y-2">
                  {liste.map((a) => {
                    const issue = ISSUES[a.issue] || {
                      label: a.issue,
                      classes: "bg-blush text-mention",
                    };
                    const facture = a.issue === "terminee" && a.montant > 0;
                    return (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-greige/50 bg-ivory px-5 py-3 shadow-soft"
                      >
                        <span className="w-12 shrink-0 text-sm tabular-nums text-mention">
                          {heure(a.date)}
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
                        <span className="text-sm text-ink">
                          {formatDuree(a.dureeSecondes)}
                        </span>
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
              </section>
            );
          })}
        </div>
      )}
    </CabinetShell>
  );
}
