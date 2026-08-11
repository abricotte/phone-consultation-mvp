"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";
import BoutonBloquer from "@/components/BoutonBloquer";
import { memeNumero } from "@/lib/format";

interface NumeroBloque {
  id: string;
  telephone: string;
  motif: string | null;
  bloque_le: string;
}

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

// +33612345678 → 06 12 34 56 78
function formatTel(t: string | null): string {
  if (!t) return "";
  const fr = t.replace(/^\+33/, "0");
  return /^0\d{9}$/.test(fr) ? fr.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : t;
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
  solde: number;
}

export default function JournalPage() {
  const [appels, setAppels] = useState<Appel[]>([]);
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [moisChoisi, setMoisChoisi] = useState<string>("");
  // Trois moments d'usage : après une permanence (aujourd'hui), le
  // lendemain matin (hier), la fin de mois (mois).
  const [periode, setPeriode] = useState<"jour" | "hier" | "mois">("mois");

  // Numéros bloqués — comparés sur les chiffres seuls, comme le serveur.
  const [bloques, setBloques] = useState<NumeroBloque[]>([]);
  function chargerBlocages() {
    api
      .adminGetNumerosBloques()
      .then((n: NumeroBloque[]) => setBloques(n))
      .catch(() => setBloques([]));
  }
  useEffect(chargerBlocages, []);

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
        // Ouvrir sur aujourd'hui si la journée a commencé ; sinon sur le
        // mois — un écran vide au réveil n'apprend rien.
        const auj = cleJour(new Date().toISOString());
        if (a.some((x) => cleJour(x.date) === auj)) setPeriode("jour");
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

  // Clés du jour et de la veille (heure locale)
  const cleAujourdhui = cleJour(new Date().toISOString());
  const cleHier = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return cleJour(d.toISOString());
  }, []);

  // Les appels réellement affichés, selon la période choisie
  const affiches = useMemo(() => {
    if (periode === "jour") return appels.filter((a) => cleJour(a.date) === cleAujourdhui);
    if (periode === "hier") return appels.filter((a) => cleJour(a.date) === cleHier);
    return appels.filter((a) => cleMois(a.date) === moisActif);
  }, [appels, periode, moisActif, cleAujourdhui, cleHier]);

  // Résumé des trois périodes — lisible AVANT même de cliquer
  const resume = useMemo(() => {
    const bilan = (liste: Appel[]) => ({
      appels: liste.length,
      encaisse: liste
        .filter((a) => a.issue === "terminee")
        .reduce((acc, a) => acc + a.montant, 0),
    });
    return {
      jour: bilan(appels.filter((a) => cleJour(a.date) === cleAujourdhui)),
      hier: bilan(appels.filter((a) => cleJour(a.date) === cleHier)),
      mois: bilan(appels.filter((a) => cleMois(a.date) === moisActif)),
    };
  }, [appels, moisActif, cleAujourdhui, cleHier]);

  // Regroupement par jour des appels affichés
  const jours = useMemo(() => {
    const parJour = new Map<string, Appel[]>();
    for (const a of affiches) {
      const k = cleJour(a.date);
      if (!parJour.has(k)) parJour.set(k, []);
      parJour.get(k)!.push(a);
    }
    return [...parJour.entries()].sort((x, y) => (x[0] < y[0] ? 1 : -1));
  }, [affiches]);

  // Indicateurs de la PÉRIODE affichée — réservés à la praticienne.
  // Ils suivent le filtre : regarder « Aujourd'hui » et lire l'encaissé
  // du mois serait incohérent.
  const stats = useMemo(() => {
    const duMois = affiches;
    const tenues = duMois.filter(
      (a) => a.issue === "terminee" || a.issue === "non_facturee"
    );
    const manques = duMois.filter((a) => a.issue === "manquee");
    const facturees = duMois.filter((a) => a.issue === "terminee");

    const total = facturees.reduce((acc, a) => acc + a.montant, 0);
    const secondes = tenues.reduce((acc, a) => acc + a.dureeSecondes, 0);

    // Clientes distinctes ayant appelé sur la période
    const idsDuMois = new Set(
      duMois.map((a) => a.clienteId).filter(Boolean) as string[]
    );
    // Parmi elles, les nouvelles : inscrites pendant la période affichée
    const inscriptions = new Map(clientes.map((c) => [c.id, c.inscriteLe]));
    const nouvelles = [...idsDuMois].filter((id) => {
      const inscrite = inscriptions.get(id);
      if (!inscrite) return false;
      if (periode === "jour") return cleJour(inscrite) === cleAujourdhui;
      if (periode === "hier") return cleJour(inscrite) === cleHier;
      return cleMois(inscrite) === moisActif;
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
  }, [affiches, clientes, moisActif, periode, cleAujourdhui, cleHier]);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse) notFound();

  return (
    <CabinetShell>
      <CabinetNav />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">
          Journal des appels
        </h1>

        {periode === "mois" && moisDisponibles.length > 1 && (
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

      {/* Trois périodes, chiffres visibles AVANT de cliquer : souvent le
          nombre suffit, sans avoir à ouvrir. */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(
          [
            { cle: "jour", titre: "Aujourd'hui", bilan: resume.jour },
            { cle: "hier", titre: "Hier", bilan: resume.hier },
            {
              cle: "mois",
              titre: libelleMois(moisActif).split(" ")[0] || "Ce mois",
              bilan: resume.mois,
            },
          ] as const
        ).map((p) => {
          const actif = periode === p.cle;
          return (
            <button
              key={p.cle}
              onClick={() => setPeriode(p.cle)}
              aria-pressed={actif}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                actif
                  ? "border-aubergine bg-aubergine text-cream shadow-card"
                  : "border-greige/60 bg-ivory hover:border-cta/40"
              }`}
            >
              <span
                className={`block text-xs font-bold uppercase tracking-wider ${
                  actif ? "text-cream/70" : "text-mention"
                }`}
              >
                {p.titre}
              </span>
              <span
                className={`mt-0.5 block text-xl font-bold tabular-nums tracking-tight sm:text-2xl ${
                  actif ? "text-cream" : "text-aubergine"
                }`}
              >
                {p.bilan.appels}
                <span
                  className={`ml-1 text-xs font-normal ${
                    actif ? "text-cream/70" : "text-mention"
                  }`}
                >
                  appel{p.bilan.appels > 1 ? "s" : ""}
                </span>
              </span>
              <span
                className={`block text-xs font-semibold tabular-nums ${
                  actif ? "text-cream/80" : "text-prix"
                }`}
              >
                {euros(p.bilan.encaisse)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Indicateurs de la période — pour toi seule */}
      {stats.appels > 0 && (
        <section className="mt-5 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Encaissé
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
                {euros(stats.total)}
              </p>
              <p className="text-xs text-mention">
                {euros(stats.panierMoyen)} en moyenne
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Appels reçus
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
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
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Clientes
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
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
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Temps d&apos;écoute
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
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

          {/* Provision, net estimé et crédit en circulation ont leur propre
              onglet « Revenus » : le journal reste le registre des appels. */}

          {stats.manques >= 3 && stats.manques > stats.tenues && (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              ⚠️ Plus d&apos;appels manqués que d&apos;appels tenus ce mois-ci —
              pensez à vérifier que votre téléphone est joignable quand vous
              passez en ligne.
            </p>
          )}
        </section>
      )}

      {/* Appels manqués récents — à rappeler, en un clic */}
      {(() => {
        const recents = appels
          .filter((a) => a.issue === "manquee" && a.clienteId)
          .filter((a) => Date.now() - new Date(a.date).getTime() < 7 * 86400000)
          .slice(0, 6);
        if (recents.length === 0) return null;
        return (
          <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/50 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              ☎ À rappeler — {recents.length} appel
              {recents.length > 1 ? "s" : ""} manqué
              {recents.length > 1 ? "s" : ""} cette semaine
            </p>
            <ul className="mt-3 space-y-1.5">
              {recents.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                >
                  <span className="w-32 shrink-0 text-mention">
                    {new Date(a.date).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    {heure(a.date)}
                  </span>
                  <a
                    href={`/cabinet-ew/clientes/${a.clienteId}`}
                    className="font-medium text-aubergine hover:text-cta hover:underline"
                  >
                    {a.cliente.prenom} {a.cliente.initiale}
                  </a>
                  {a.cliente.telephone && (
                    <a
                      href={`tel:${a.cliente.telephone}`}
                      className="rounded-full bg-ivory px-3 py-1 text-xs font-medium text-prix ring-1 ring-cta-outline transition hover:bg-cta hover:text-cta-text"
                    >
                      ☎ {formatTel(a.cliente.telephone)}
                    </a>
                  )}
                  {a.cliente.telephone && (
                    <BoutonBloquer
                      telephone={a.cliente.telephone}
                      nom={a.cliente.prenom}
                      bloqueId={
                        bloques.find((b) => memeNumero(b.telephone, a.cliente.telephone))?.id ??
                        null
                      }
                      onChange={chargerBlocages}
                      discret
                    />
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-mention">
              Elle a essayé de vous joindre — un rappel transforme souvent un
              appel manqué en consultation.
            </p>
          </section>
        );
      })()}

      {jours.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-10 text-center">
          <p className="text-3xl">☾</p>
          <p className="mt-2 text-sm text-mention">
            {periode === "jour"
              ? "Aucun appel aujourd'hui."
              : periode === "hier"
              ? "Aucun appel hier."
              : "Aucun appel ce mois-ci."}
          </p>
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
                  <h2 className="font-jakarta text-base font-bold uppercase tracking-wide text-aubergine">
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
