"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";
import {
  chargerReglages,
  enregistrerReglage,
  enregistrerReglages,
  type Reglages,
} from "@/lib/reglages";

interface Appel {
  id: string;
  date: string;
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

interface Recharge {
  id: string;
  date: string;
  montant: number;
  description: string;
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

function moisPrecedent(cle: string): string {
  const [a, m] = cle.split("-").map(Number);
  const d = new Date(a, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Frais Stripe (cartes européennes) : 1,5 % + 0,25 € par transaction.
// Estimation de pilotage — les montants exacts sont dans Stripe.
const STRIPE_TAUX = 0.015;
const STRIPE_FIXE = 0.25;
// Twilio : ~0,03 €/min pour les DEUX jambes de l'appel.
const TWILIO_MINUTE = 0.03;

// Export CSV — les frais y figurent : c'est le comptable qui les lira
function exporterCSV(
  appels: Appel[],
  mois: string,
  frais: {
    stripe: number;
    twilio: number;
    fixes: number;
    urssaf: number;
    impot: number;
    tauxUrssaf: number;
    tauxImpot: number;
    net: number;
    encaisseTTC: number;
    tva: number;
    encaisseHT: number;
    tvaActive: boolean;
    tvaTaux: number;
  }
) {
  const eur = (n: number) => n.toFixed(2).replace(".", ",");
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
    [],
    ["RÉCAPITULATIF DU MOIS", "", "", "", "", "", ""],
    ["Encaissé TTC", "", "", "", "", "", eur(frais.encaisseTTC)],
    ...(frais.tvaActive
      ? [
          [`TVA collectée (${frais.tvaTaux} %)`, "", "", "", "", "", `-${eur(frais.tva)}`],
          ["Chiffre d'affaires HT", "", "", "", "", "", eur(frais.encaisseHT)],
        ]
      : []),
    ["Frais Stripe (estimation)", "", "", "", "", "", `-${eur(frais.stripe)}`],
    ["Frais Twilio (estimation)", "", "", "", "", "", `-${eur(frais.twilio)}`],
    ["Coûts fixes", "", "", "", "", "", `-${eur(frais.fixes)}`],
    [`URSSAF (${frais.tauxUrssaf} %)`, "", "", "", "", "", `-${eur(frais.urssaf)}`],
    [`Impôt (${frais.tauxImpot} %)`, "", "", "", "", "", `-${eur(frais.impot)}`],
    ["NET ESTIMÉ", "", "", "", "", "", eur(frais.net)],
    [],
    ["Estimations de pilotage — les pièces officielles proviennent de Stripe et des relevés bancaires."],
  ];

  const csv = lignes
    .map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `revenus-${mois}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RevenusPage() {
  const [appels, setAppels] = useState<Appel[]>([]);
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [moisChoisi, setMoisChoisi] = useState("");
  const [reglages, setReglages] = useState<Reglages>(chargerReglages());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    setReglages(chargerReglages());

    Promise.all([
      api.adminGetAppels(),
      api.adminGetClientes(),
      api.adminGetRecharges(),
    ])
      .then(([a, c, r]: [Appel[], ClienteRef[], Recharge[]]) => {
        setAppels(a);
        setClientes(c);
        setRecharges(r);
      })
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, []);

  function majReglage(cle: keyof Reglages, valeur: number) {
    const suivant = enregistrerReglage(cle, valeur);
    setReglages(suivant);
  }

  const moisDisponibles = useMemo(() => {
    const set = new Set([
      ...appels.map((a) => cleMois(a.date)),
      ...recharges.map((r) => cleMois(r.date)),
    ]);
    return [...set].sort().reverse();
  }, [appels, recharges]);

  const moisActif = moisChoisi || moisDisponibles[0] || "";

  // Cascade du mois : de l'encaissé au net réellement gardé
  const cascade = useMemo(() => {
    const duMois = appels.filter((a) => cleMois(a.date) === moisActif);
    const facturees = duMois.filter((a) => a.issue === "terminee");
    const tenues = duMois.filter(
      (a) => a.issue === "terminee" || a.issue === "non_facturee"
    );
    const rechargesMois = recharges.filter((r) => cleMois(r.date) === moisActif);

    // Les prix affichés aux clientes sont TTC (obligation en B2C).
    const encaisseTTC = facturees.reduce((acc, a) => acc + a.montant, 0);
    const encaisseRecharges = rechargesMois.reduce((acc, r) => acc + r.montant, 0);

    // LA TVA N'EST PAS VOTRE ARGENT : collectée pour l'État, elle sort
    // avant tout le reste. Les cotisations se calculent ensuite sur le HT.
    const t = reglages.tvaActive ? reglages.tvaTaux / 100 : 0;
    const tvaCollectee = reglages.tvaActive ? encaisseTTC - encaisseTTC / (1 + t) : 0;
    const encaisseHT = encaisseTTC - tvaCollectee;

    // Stripe facture les RECHARGES (c'est là que l'argent entre)
    const fraisStripe =
      encaisseRecharges * STRIPE_TAUX + rechargesMois.length * STRIPE_FIXE;

    // Twilio facture le temps de communication réel
    const secondes = tenues.reduce((acc, a) => acc + a.dureeSecondes, 0);
    const fraisTwilio = (secondes / 60) * TWILIO_MINUTE;

    const coutsFixes = reglages.coutsFixes;
    // Assiette des cotisations ET de l'impôt : le chiffre d'affaires HT
    const urssaf = (encaisseHT * reglages.urssaf) / 100;
    const impot = (encaisseHT * reglages.impot) / 100;
    const provision = urssaf + impot;
    const net = encaisseHT - fraisStripe - fraisTwilio - coutsFixes - provision;

    const minutes = secondes / 60;

    return {
      encaisseTTC,
      tvaCollectee,
      encaisseHT,
      encaisseRecharges,
      nbRecharges: rechargesMois.length,
      fraisStripe,
      fraisTwilio,
      coutsFixes,
      urssaf,
      impot,
      provision,
      net,
      nbFacturees: facturees.length,
      nbTenues: tenues.length,
      minutes,
      // Revenu réel par minute d'écoute : les appels < 1 min non
      // facturés le font mécaniquement baisser sous les 2,90 € affichés
      revenuParMinute: minutes > 0 ? encaisseTTC / minutes : 0,
      panierConsultation: facturees.length ? encaisseTTC / facturees.length : 0,
      panierRecharge: rechargesMois.length
        ? encaisseRecharges / rechargesMois.length
        : 0,
      lignes: duMois,
    };
  }, [appels, recharges, moisActif, reglages]);

  const encaissePrecedent = useMemo(() => {
    const prec = moisPrecedent(moisActif);
    return appels
      .filter((a) => cleMois(a.date) === prec && a.issue === "terminee")
      .reduce((acc, a) => acc + a.montant, 0);
  }, [appels, moisActif]);

  const creditEnCirculation = clientes.reduce((acc, c) => acc + (c.solde || 0), 0);

  // Répartition par formule
  const parFormule = useMemo(() => {
    const m = new Map<string, { nb: number; total: number }>();
    for (const a of cascade.lignes.filter((x) => x.issue === "terminee")) {
      const e = m.get(a.formule) || { nb: 0, total: 0 };
      e.nb += 1;
      e.total += a.montant;
      m.set(a.formule, e);
    }
    return [...m.entries()].sort((x, y) => y[1].total - x[1].total);
  }, [cascade.lignes]);

  const precedentExiste = moisDisponibles.includes(moisPrecedent(moisActif));
  const ecartEuros = cascade.encaisseTTC - encaissePrecedent;
  const ecartPct =
    precedentExiste && encaissePrecedent > 0
      ? Math.round((ecartEuros / encaissePrecedent) * 100)
      : null;

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse) notFound();

  const pct = (v: number) =>
    cascade.encaisseTTC > 0 ? `${Math.round((v / cascade.encaisseTTC) * 100)} %` : "—";

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
          {cascade.lignes.length > 0 && (
            <button
              onClick={() =>
                exporterCSV(cascade.lignes, moisActif, {
                  stripe: cascade.fraisStripe,
                  twilio: cascade.fraisTwilio,
                  fixes: cascade.coutsFixes,
                  urssaf: cascade.urssaf,
                  impot: cascade.impot,
                  tauxUrssaf: reglages.urssaf,
                  tauxImpot: reglages.impot,
                  net: cascade.net,
                  encaisseTTC: cascade.encaisseTTC,
                  tva: cascade.tvaCollectee,
                  encaisseHT: cascade.encaisseHT,
                  tvaActive: reglages.tvaActive,
                  tvaTaux: reglages.tvaTaux,
                })
              }
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
          {/* 1. LE CHIFFRE QUI COMPTE */}
          <section className="mt-5 rounded-3xl border-2 border-statut-online/30 bg-green-50/40 p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-mention">
              Ce que vous gardez ce mois-ci
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="text-4xl font-bold tabular-nums tracking-tight text-statut-online sm:text-5xl">
                {euros(cascade.net)}
              </p>
              <p className="text-sm text-mention">
                sur {euros(cascade.encaisseTTC)} encaissés
                {ecartPct !== null && (
                  <>
                    {" · "}
                    <span
                      className={
                        ecartEuros >= 0
                          ? "font-semibold text-statut-online"
                          : "font-semibold text-amber-700"
                      }
                    >
                      {ecartEuros >= 0 ? "+" : ""}
                      {ecartPct} % ({ecartEuros >= 0 ? "+" : ""}
                      {euros(ecartEuros)})
                    </span>{" "}
                    vs {libelleMois(moisPrecedent(moisActif)).split(" ")[0]}
                  </>
                )}
              </p>
            </div>
          </section>

          {/* 2. LE DÉTAIL, EN TABLEAU SOBRE */}
          <section className="mt-4 overflow-hidden rounded-3xl border border-greige/50 bg-ivory shadow-soft">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { l: "Encaissé TTC", v: cascade.encaisseTTC, fort: true },
                  ...(reglages.tvaActive
                    ? [
                        {
                          l: "TVA collectée",
                          v: -cascade.tvaCollectee,
                          reglable: "tva" as const,
                        },
                        {
                          l: "Chiffre d'affaires HT",
                          v: cascade.encaisseHT,
                          fort: true,
                          intermediaire: true,
                        },
                      ]
                    : []),
                  {
                    l: `Frais Stripe (${cascade.nbRecharges} recharge${cascade.nbRecharges > 1 ? "s" : ""})`,
                    v: -cascade.fraisStripe,
                  },
                  {
                    l: `Frais Twilio (${Math.round(cascade.minutes)} min)`,
                    v: -cascade.fraisTwilio,
                  },
                  { l: "Coûts fixes", v: -cascade.coutsFixes, reglable: "coutsFixes" as const },
                  {
                    l: reglages.tvaActive ? "URSSAF (sur le HT)" : "URSSAF",
                    v: -cascade.urssaf,
                    reglable: "urssaf" as const,
                  },
                  {
                    l: reglages.tvaActive ? "Impôt (sur le HT)" : "Impôt",
                    v: -cascade.impot,
                    reglable: "impot" as const,
                  },
                ].map((r) => (
                  <tr
                    key={r.l}
                    className={`border-b border-greige/40 ${
                      "intermediaire" in r && r.intermediaire ? "bg-cream/60" : ""
                    }`}
                  >
                    <td className="px-5 py-2.5 text-ink">
                      <span className="flex flex-wrap items-center gap-2">
                        {r.l}
                        {r.reglable === "tva" && (
                          <label className="flex items-center gap-1 text-xs text-mention">
                            <input
                              type="number"
                              min={0}
                              max={30}
                              step={0.1}
                              value={reglages.tvaTaux}
                              onChange={(e) =>
                                majReglage("tvaTaux", Number(e.target.value))
                              }
                              className="w-14 rounded-lg border border-greige bg-ivory px-2 py-0.5 text-right text-ink focus:border-cta-outline focus:outline-none"
                            />
                            %
                          </label>
                        )}
                        {(r.reglable === "urssaf" || r.reglable === "impot") && (
                          <label className="flex items-center gap-1 text-xs text-mention">
                            <input
                              type="number"
                              min={0}
                              max={60}
                              step={0.1}
                              value={reglages[r.reglable]}
                              onChange={(e) =>
                                majReglage(r.reglable, Number(e.target.value))
                              }
                              className="w-14 rounded-lg border border-greige bg-ivory px-2 py-0.5 text-right text-ink focus:border-cta-outline focus:outline-none"
                            />
                            %
                          </label>
                        )}
                        {r.reglable === "coutsFixes" && (
                          <label className="flex items-center gap-1 text-xs text-mention">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={reglages.coutsFixes}
                              onChange={(e) =>
                                majReglage("coutsFixes", Number(e.target.value))
                              }
                              className="w-16 rounded-lg border border-greige bg-ivory px-2 py-0.5 text-right text-ink focus:border-cta-outline focus:outline-none"
                            />
                            €/mois
                          </label>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs text-mention">
                      {pct(Math.abs(r.v))}
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-2.5 text-right font-bold tabular-nums ${
                        "fort" in r && r.fort ? "text-aubergine" : "text-mention"
                      }`}
                    >
                      {"fort" in r && r.fort ? "" : "−"}
                      {euros(Math.abs(r.v))}
                    </td>
                  </tr>
                ))}
                <tr className="bg-green-50/50">
                  <td className="px-5 py-3 font-bold text-aubergine">
                    = Net estimé
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-mention">
                    {pct(cascade.net)}
                  </td>
                  <td className="px-5 py-3 text-right text-lg font-bold tabular-nums text-statut-online">
                    {euros(cascade.net)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-greige/40 px-5 py-3">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={reglages.tvaActive}
                  onChange={(e) =>
                    setReglages(enregistrerReglages({ tvaActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-greige accent-cta"
                />
                Je suis assujettie à la TVA
              </label>
              <p className="text-xs text-mention">
                Frais Stripe et Twilio estimés (1,5 % + 0,25 € par recharge ·
                0,03 €/min). Outil de pilotage — vos pièces officielles restent
                les rapports Stripe et vos relevés bancaires.
              </p>
            </div>
          </section>

          {/* 3. INDICATEURS DE SANTÉ */}
          <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
            <h2 className="font-jakarta text-lg font-bold text-aubergine">
              Indicateurs de santé
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">
                  Panier consultation
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {euros(cascade.panierConsultation)}
                </p>
                <p className="text-xs text-mention">
                  {cascade.nbFacturees} facturée
                  {cascade.nbFacturees > 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">
                  Panier recharge
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {euros(cascade.panierRecharge)}
                </p>
                <p className="text-xs text-mention">
                  {cascade.nbRecharges} recharge
                  {cascade.nbRecharges > 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">
                  Revenu par minute
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {euros(cascade.revenuParMinute)}
                </p>
                <p className="text-xs text-mention">
                  théorique 2,90 € — l&apos;écart vient des appels de moins
                  d&apos;une minute
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">
                  Crédit en circulation
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {euros(creditEnCirculation)}
                </p>
                <p className="text-xs text-mention">
                  déposé, pas encore utilisé
                </p>
              </div>
            </div>
          </section>

          {/* 4. RÉPARTITION PAR FORMULE */}
          {parFormule.length > 0 && (
            <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
              <h2 className="font-jakarta text-lg font-bold text-aubergine">
                Par formule
              </h2>
              <ul className="mt-3 space-y-2.5">
                {parFormule.map(([formule, d]) => {
                  const part =
                    cascade.encaisseTTC > 0 ? (d.total / cascade.encaisseTTC) * 100 : 0;
                  return (
                    <li key={formule}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                        <span className="text-ink">
                          {formule}{" "}
                          <span className="text-mention">
                            · {d.nb} consultation{d.nb > 1 ? "s" : ""}
                          </span>
                        </span>
                        <span className="font-bold tabular-nums text-aubergine">
                          {euros(d.total)}{" "}
                          <span className="text-xs font-normal text-mention">
                            {Math.round(part)} %
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-greige/40">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${part}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <p className="mt-4 text-xs text-mention">
            Le détail appel par appel se trouve dans le{" "}
            <a href="/cabinet-ew/journal" className="text-prix hover:underline">
              journal
            </a>
            . Provision et coûts fixes sont vos réglages, conservés sur cet
            appareil.
          </p>
        </>
      )}
    </CabinetShell>
  );
}
