"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetShell from "@/components/CabinetShell";
import {
  chargerReglages,
  rafraichirReglages,
  enregistrerReglages,
  type Reglages,
} from "@/lib/reglages";

// REVENUS — une page qui se lit en trente secondes (réorganisée le
// 11 octobre 2026, à la demande d'Elena : « clair et simple, pas
// surchargé »).
//
//   1. Ce que vous gardez ce mois-ci   le net, l'encaissé, combien de
//                                      chaque, l'objectif
//   2. Dans le temps                   six mois côte à côte, l'année
//   3. Le détail                       de l'encaissé au net, ligne à ligne
//   4. Par formule                     ce que chaque formule rapporte,
//                                      et ce qu'elle laisse vraiment
//   5. Indicateurs de santé            panier, clientes, minute, crédit
//   6. Réglages                        repliés : taux, coûts, objectif
//
// Deux sources d'argent, toujours : les appels à la minute (via le
// crédit) et les rendez-vous payés sur Calendly. Tout est TTC côté
// clientes (B2C) ; la TVA sort avant tout le reste.
//
// Estimations de pilotage — les pièces officielles restent Stripe,
// Calendly et les relevés bancaires.

interface Appel {
  id: string;
  date: string;
  clienteId?: string | null;
  cliente: { prenom: string; initiale: string; telephone: string | null };
  formule: string;
  issue: string;
  dureeSecondes: number;
  montant: number;
}

interface ClienteRef {
  id: string;
  solde: number;
  inscriteLe?: string | null;
}

interface Recharge {
  id: string;
  date: string;
  montant: number;
  description: string;
}

// Un rendez-vous payé sur Calendly — à sa date de paiement. Depuis
// septembre, c'est par là que passe l'argent d'Elena.
interface EncaissementCalendly {
  id: string;
  clientId?: string | null;
  date: string;
  prenom: string;
  formule: string;
  minutes: number;
  montant: number;
}

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}
/** « 4 820 € » — pour les chiffres lus de loin */
function eurosRonds(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function cleMois(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function libelleMois(cle: string): string {
  const [a, m] = cle.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function moisPrecedent(cle: string): string {
  const [a, m] = cle.split("-").map(Number);
  const d = new Date(a, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
/** Les N mois qui précèdent (et incluent) un mois, du plus ancien au plus récent */
function derniersMois(cle: string, n: number): string[] {
  const out = [cle];
  while (out.length < n) out.unshift(moisPrecedent(out[0]));
  return out;
}
/** Janvier → ce mois, de la même année */
function moisDeLAnnee(cle: string): string[] {
  const [a, m] = cle.split("-").map(Number);
  return Array.from({ length: m }, (_, i) => `${a}-${String(i + 1).padStart(2, "0")}`);
}

/** Découverte, Complète, à la minute — « combien de chaque ? » */
type Categorie = "decouverte" | "complete" | "minute" | "autre";
const CATEGORIES: [Categorie, string][] = [
  ["decouverte", "Découverte"],
  ["complete", "Complète"],
  ["minute", "à la minute"],
  ["autre", "autre"],
];
function categorie(formule: string): Categorie {
  const f = formule.toLowerCase();
  if (f.includes("découverte") || f.includes("decouverte")) return "decouverte";
  if (f.includes("complète") || f.includes("complete")) return "complete";
  if (f.includes("immédiate") || f.includes("minute")) return "minute";
  return "autre";
}

// Frais Stripe (cartes européennes) : 1,5 % + 0,25 € par transaction.
const STRIPE_TAUX = 0.015;
const STRIPE_FIXE = 0.25;
// Twilio : ~0,03 €/min pour les DEUX jambes de l'appel.
const TWILIO_MINUTE = 0.03;

// ── Le calcul d'un mois : une fonction pure, la même pour l'affichage,
//    l'historique et les exports. De l'encaissé au net réellement gardé.
interface Mois {
  cle: string;
  lignes: Appel[];
  encaisseTTC: number;
  encaisseAppels: number;
  encaisseCalendly: number;
  nbFacturees: number;
  nbCalendly: number;
  nbRecharges: number;
  encaisseRecharges: number;
  comptes: Record<Categorie, number>;
  tvaCollectee: number;
  encaisseHT: number;
  fraisStripe: number;
  fraisTwilio: number;
  coutsFixes: number;
  urssaf: number;
  impot: number;
  net: number;
  minutes: number;
  revenuParMinute: number;
  panierConsultation: number;
  clientes: Set<string>;
}

function calculerMois(
  cle: string,
  appels: Appel[],
  recharges: Recharge[],
  calendly: EncaissementCalendly[],
  r: Reglages
): Mois {
  const duMois = appels.filter((a) => cleMois(a.date) === cle);
  const facturees = duMois.filter((a) => a.issue === "terminee");
  const tenues = duMois.filter((a) => a.issue === "terminee" || a.issue === "non_facturee");
  const rechargesMois = recharges.filter((x) => cleMois(x.date) === cle);
  const calendlyMois = calendly.filter((k) => cleMois(k.date) === cle);

  const encaisseAppels = facturees.reduce((acc, a) => acc + a.montant, 0);
  const encaisseCalendly = calendlyMois.reduce((acc, k) => acc + k.montant, 0);
  const encaisseTTC = encaisseAppels + encaisseCalendly;
  const encaisseRecharges = rechargesMois.reduce((acc, x) => acc + x.montant, 0);

  // LA TVA N'EST PAS VOTRE ARGENT : collectée pour l'État, elle sort
  // avant tout le reste. Les cotisations se calculent ensuite sur le HT.
  const t = r.tvaActive ? r.tvaTaux / 100 : 0;
  const tvaCollectee = r.tvaActive ? encaisseTTC - encaisseTTC / (1 + t) : 0;
  const encaisseHT = encaisseTTC - tvaCollectee;

  // Stripe facture là où l'argent entre : recharges et paiements Calendly
  const fraisStripe =
    (encaisseRecharges + encaisseCalendly) * STRIPE_TAUX +
    (rechargesMois.length + calendlyMois.length) * STRIPE_FIXE;
  // Twilio facture le temps de communication réel
  const secondes = tenues.reduce((acc, a) => acc + a.dureeSecondes, 0);
  const fraisTwilio = (secondes / 60) * TWILIO_MINUTE;

  const urssaf = (encaisseHT * r.urssaf) / 100;
  const impot = (encaisseHT * r.impot) / 100;
  const net = encaisseHT - fraisStripe - fraisTwilio - r.coutsFixes - urssaf - impot;

  const comptes: Record<Categorie, number> = { decouverte: 0, complete: 0, minute: 0, autre: 0 };
  for (const a of facturees) comptes[categorie(a.formule)] += 1;
  for (const k of calendlyMois) comptes[categorie(k.formule)] += 1;

  // Les clientes du mois : celles qui ont payé quelque chose
  const clientes = new Set<string>();
  for (const a of facturees) if (a.clienteId) clientes.add(a.clienteId);
  for (const k of calendlyMois) if (k.clientId) clientes.add(k.clientId);

  // Les rendez-vous Calendly rejoignent les lignes (export, par formule)
  const lignesCalendly: Appel[] = calendlyMois.map((k) => ({
    id: k.id,
    date: k.date,
    clienteId: k.clientId ?? null,
    cliente: { prenom: k.prenom, initiale: "", telephone: null },
    formule: `${k.formule} (Calendly)`,
    issue: "calendly",
    dureeSecondes: k.minutes * 60,
    montant: k.montant,
  }));

  const minutes = secondes / 60;
  const nb = facturees.length + calendlyMois.length;
  return {
    cle,
    lignes: [...duMois, ...lignesCalendly].sort((x, y) => y.date.localeCompare(x.date)),
    encaisseTTC,
    encaisseAppels,
    encaisseCalendly,
    nbFacturees: facturees.length,
    nbCalendly: calendlyMois.length,
    nbRecharges: rechargesMois.length,
    encaisseRecharges,
    comptes,
    tvaCollectee,
    encaisseHT,
    fraisStripe,
    fraisTwilio,
    coutsFixes: r.coutsFixes,
    urssaf,
    impot,
    net,
    minutes,
    // Revenu réel par minute d'écoute : les appels < 1 min non facturés
    // le font mécaniquement baisser sous les 2,90 € affichés
    revenuParMinute: minutes > 0 ? encaisseAppels / minutes : 0,
    panierConsultation: nb > 0 ? encaisseTTC / nb : 0,
    clientes,
  };
}

// ── Exports CSV — les frais y figurent : c'est le comptable qui les lira
const eur = (n: number) => n.toFixed(2).replace(".", ",");
function telechargerCSV(lignes: (string | number)[][], nom: string) {
  const csv = lignes
    .map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}
function lignesDetail(lignes: Appel[]): (string | number)[][] {
  return lignes.map((a) => {
    const d = new Date(a.date);
    return [
      d.toLocaleDateString("fr-FR"),
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      `${a.cliente.prenom} ${a.cliente.initiale}`.trim(),
      a.formule,
      String(a.dureeSecondes || 0),
      a.issue,
      eur(a.montant),
    ];
  });
}
function recapitulatif(m: Mois, r: Reglages): (string | number)[][] {
  return [
    ["Encaissé TTC", "", "", "", "", "", eur(m.encaisseTTC)],
    ...(r.tvaActive
      ? [
          [`TVA collectée (${r.tvaTaux} %)`, "", "", "", "", "", `-${eur(m.tvaCollectee)}`],
          ["Chiffre d'affaires HT", "", "", "", "", "", eur(m.encaisseHT)],
        ]
      : []),
    ["Frais Stripe (estimation)", "", "", "", "", "", `-${eur(m.fraisStripe)}`],
    ["Frais Twilio (estimation)", "", "", "", "", "", `-${eur(m.fraisTwilio)}`],
    ["Coûts fixes", "", "", "", "", "", `-${eur(m.coutsFixes)}`],
    [`URSSAF (${r.urssaf} %)`, "", "", "", "", "", `-${eur(m.urssaf)}`],
    [`Impôt (${r.impot} %)`, "", "", "", "", "", `-${eur(m.impot)}`],
    ["NET ESTIMÉ", "", "", "", "", "", eur(m.net)],
  ];
}
const ENTETE = ["Date", "Heure", "Cliente", "Formule", "Durée (s)", "Issue", "Montant (€)"];
const NOTE = ["Estimations de pilotage — les pièces officielles proviennent de Stripe, Calendly et des relevés bancaires."];

function exporterMois(m: Mois, r: Reglages) {
  telechargerCSV(
    [ENTETE, ...lignesDetail(m.lignes), [], ["RÉCAPITULATIF DU MOIS"], ...recapitulatif(m, r), [], NOTE],
    `revenus-${m.cle}.csv`
  );
}
// L'export annuel : un tableau mois par mois, puis le détail de l'année
function exporterAnnee(mois: Mois[], annee: number, r: Reglages) {
  const tableau: (string | number)[][] = [
    ["Mois", "Encaissé TTC", "Découverte", "Complète", "À la minute", "TVA", "CA HT", "Stripe (est.)", "Twilio (est.)", "Coûts fixes", "URSSAF", "Impôt", "Net estimé"],
    ...mois.map((m) => [
      libelleMois(m.cle),
      eur(m.encaisseTTC),
      m.comptes.decouverte,
      m.comptes.complete,
      m.comptes.minute,
      eur(m.tvaCollectee),
      eur(m.encaisseHT),
      eur(m.fraisStripe),
      eur(m.fraisTwilio),
      eur(m.coutsFixes),
      eur(m.urssaf),
      eur(m.impot),
      eur(m.net),
    ]),
  ];
  const somme = (f: (m: Mois) => number) => mois.reduce((acc, m) => acc + f(m), 0);
  tableau.push([
    `TOTAL ${annee}`,
    eur(somme((m) => m.encaisseTTC)),
    somme((m) => m.comptes.decouverte),
    somme((m) => m.comptes.complete),
    somme((m) => m.comptes.minute),
    eur(somme((m) => m.tvaCollectee)),
    eur(somme((m) => m.encaisseHT)),
    eur(somme((m) => m.fraisStripe)),
    eur(somme((m) => m.fraisTwilio)),
    eur(somme((m) => m.coutsFixes)),
    eur(somme((m) => m.urssaf)),
    eur(somme((m) => m.impot)),
    eur(somme((m) => m.net)),
  ]);
  const detail = mois.flatMap((m) => lignesDetail(m.lignes));
  telechargerCSV(
    [[`ANNÉE ${annee}`], ...tableau, [], ["DÉTAIL"], ENTETE, ...detail, [], NOTE],
    `revenus-${annee}.csv`
  );
}

export default function RevenusPage() {
  const [appels, setAppels] = useState<Appel[]>([]);
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [calendly, setCalendly] = useState<EncaissementCalendly[]>([]);
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
    // Les réglages viennent de la base : ils suivent Elena d'un navigateur
    // à l'autre au lieu de dériver dans le cache de chaque machine.
    rafraichirReglages().then(setReglages).catch(() => {});

    Promise.all([
      api.adminGetAppels(),
      api.adminGetClientes(),
      api.adminGetRecharges(),
      // Tolérant : si le serveur n'a pas encore cette route, la page vit
      // sans les lignes Calendly plutôt que de disparaître en 404.
      api.adminGetEncaissementsCalendly().catch(() => []),
    ])
      .then(([a, c, r, k]: [Appel[], ClienteRef[], Recharge[], EncaissementCalendly[]]) => {
        setAppels(a);
        setClientes(c);
        setRecharges(r);
        setCalendly(k || []);
      })
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, []);

  function majReglage(cle: keyof Reglages, valeur: number | boolean) {
    setReglages((r) => ({ ...r, [cle]: valeur })); // réponse immédiate
    enregistrerReglages({ [cle]: valeur }).then(setReglages).catch(() => {});
  }

  const moisDisponibles = useMemo(() => {
    const set = new Set([
      ...appels.map((a) => cleMois(a.date)),
      ...recharges.map((r) => cleMois(r.date)),
      ...calendly.map((k) => cleMois(k.date)),
    ]);
    return [...set].sort().reverse();
  }, [appels, recharges, calendly]);

  const moisActif = moisChoisi || moisDisponibles[0] || "";
  const calculer = (cle: string) => calculerMois(cle, appels, recharges, calendly, reglages);

  const mois = useMemo(
    () => calculer(moisActif),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appels, recharges, calendly, moisActif, reglages]
  );
  const precedent = useMemo(
    () => (moisActif ? calculer(moisPrecedent(moisActif)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appels, recharges, calendly, moisActif, reglages]
  );

  // Six mois côte à côte : une comparaison se lit d'un regard
  const historique = useMemo(
    () => (moisActif ? derniersMois(moisActif, 6).map(calculer) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appels, recharges, calendly, moisActif, reglages]
  );
  const maxHistorique = Math.max(...historique.map((h) => h.encaisseTTC), 1);

  // L'année : le cumul depuis janvier, et où elle finit à ce rythme
  const annee = useMemo(() => {
    if (!moisActif) return null;
    const an = Number(moisActif.slice(0, 4));
    const tous = moisDeLAnnee(moisActif).map(calculer);
    const cumul = tous.reduce((acc, m) => acc + m.encaisseTTC, 0);
    const netCumul = tous.reduce((acc, m) => acc + m.net, 0);
    const maintenant = new Date();
    const anneeEnCours = an === maintenant.getFullYear();
    const moisCourant = moisActif === cleMois(maintenant.toISOString());
    // Mois écoulés, le mois en cours au prorata du jour
    const joursDuMois = new Date(an, Number(moisActif.slice(5, 7)), 0).getDate();
    const ecoules = moisCourant
      ? tous.length - 1 + maintenant.getDate() / joursDuMois
      : tous.length;
    const projection = ecoules > 0 ? (cumul / ecoules) * 12 : 0;
    return { an, tous, cumul, netCumul, anneeEnCours, projection };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appels, recharges, calendly, moisActif, reglages]);

  const creditEnCirculation = clientes.reduce((acc, c) => acc + (c.solde || 0), 0);

  // Les clientes du mois, et parmi elles les nouvelles (fiche créée ce mois)
  const nouvellesClientes = useMemo(() => {
    const inscription = new Map(clientes.map((c) => [c.id, c.inscriteLe]));
    let n = 0;
    for (const id of mois.clientes) {
      const le = inscription.get(id);
      if (le && cleMois(le) === moisActif) n += 1;
    }
    return n;
  }, [clientes, mois, moisActif]);

  // Par formule : le brut, et ce qu'il laisse vraiment (au prorata du net du mois)
  const parFormule = useMemo(() => {
    const m = new Map<string, { nb: number; total: number }>();
    for (const a of mois.lignes.filter((x) => x.issue === "terminee" || x.issue === "calendly")) {
      const e = m.get(a.formule) || { nb: 0, total: 0 };
      e.nb += 1;
      e.total += a.montant;
      m.set(a.formule, e);
    }
    return [...m.entries()].sort((x, y) => y[1].total - x[1].total);
  }, [mois.lignes]);
  const ratioNet = mois.encaisseTTC > 0 ? mois.net / mois.encaisseTTC : 0;

  const precedentExiste = !!precedent && moisDisponibles.includes(precedent.cle);
  const ecartEuros = precedent ? mois.encaisseTTC - precedent.encaisseTTC : 0;
  const ecartPct =
    precedentExiste && precedent && precedent.encaisseTTC > 0
      ? Math.round((ecartEuros / precedent.encaisseTTC) * 100)
      : null;

  const objectif = reglages.objectifMensuel;
  const objectifPct = objectif > 0 ? Math.min(100, Math.round((mois.encaisseTTC / objectif) * 100)) : 0;

  if (loading)
    return (
      <CabinetShell>
        <p className="mt-16 text-center text-mention">Chargement…</p>
      </CabinetShell>
    );
  if (accesRefuse) notFound();

  const pct = (v: number) =>
    mois.encaisseTTC > 0 ? `${Math.round((v / mois.encaisseTTC) * 100)} %` : "—";

  const champReglage =
    "w-20 rounded-lg border border-greige bg-white px-2 py-1 text-right text-ink focus:border-cta-outline focus:outline-none";

  return (
    <CabinetShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">Revenus</h1>
          {moisActif && <p className="mt-1 text-sm capitalize text-mention">{libelleMois(moisActif)}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          {mois.lignes.length > 0 && (
            <button
              onClick={() => exporterMois(mois, reglages)}
              className="whitespace-nowrap rounded-full border border-cta-outline px-4 py-2 text-sm font-medium text-prix transition hover:bg-cta hover:text-cta-text"
            >
              ↓ Export du mois
            </button>
          )}
          {annee && annee.cumul > 0 && (
            <button
              onClick={() => exporterAnnee(annee.tous, annee.an, reglages)}
              className="whitespace-nowrap rounded-full border border-greige px-4 py-2 text-sm font-medium text-mention transition hover:border-cta-outline hover:text-prix"
              title="Mois par mois, puis le détail — pour le comptable"
            >
              ↓ Export {annee.an}
            </button>
          )}
        </div>
      </div>

      {moisDisponibles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-10 text-center">
          <p className="text-3xl">◈</p>
          <p className="mt-2 text-sm text-mention">Aucune consultation facturée pour l&apos;instant.</p>
        </div>
      ) : (
        <>
          {/* ── 1. CE QUE VOUS GARDEZ CE MOIS-CI ── */}
          <section className="mt-5 rounded-3xl border-2 border-statut-online/30 bg-green-50/40 p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-mention">
              Ce que vous gardez ce mois-ci
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="text-4xl font-bold tabular-nums tracking-tight text-statut-online sm:text-5xl">
                {euros(mois.net)}
              </p>
              <p className="text-sm text-mention">
                sur {euros(mois.encaisseTTC)} encaissés
                {ecartPct !== null && precedent && (
                  <>
                    {" · "}
                    <span
                      className={
                        ecartEuros >= 0 ? "font-semibold text-statut-online" : "font-semibold text-amber-700"
                      }
                    >
                      {ecartEuros >= 0 ? "+" : ""}
                      {ecartPct} % ({ecartEuros >= 0 ? "+" : ""}
                      {euros(ecartEuros)})
                    </span>{" "}
                    vs {libelleMois(precedent.cle).split(" ")[0]}
                  </>
                )}
              </p>
            </div>

            {/* Combien de chaque — la question d'Elena */}
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-statut-online/20 pt-3 text-sm text-ink">
              {CATEGORIES.filter(([k]) => mois.comptes[k] > 0).map(([k, l]) => (
                <span key={k}>
                  <span className="font-bold tabular-nums text-aubergine">{mois.comptes[k]}</span> {l}
                </span>
              ))}
              {mois.nbFacturees + mois.nbCalendly === 0 && (
                <span className="text-mention">aucune consultation facturée ce mois-ci</span>
              )}
            </p>

            {/* L'objectif — c'est elle qui le pose (réglages), il n'impose rien */}
            {objectif > 0 && (
              <div className="mt-4">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-mention">
                    Objectif du mois : <span className="font-semibold text-ink">{eurosRonds(objectif)}</span>
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      objectifPct >= 100 ? "text-statut-online" : "text-aubergine"
                    }`}
                  >
                    {objectifPct >= 100 ? "atteint ✦" : `${objectifPct} %`}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/70">
                  <div
                    className={`h-full rounded-full ${objectifPct >= 100 ? "bg-statut-online" : "bg-gold"}`}
                    style={{ width: `${objectifPct}%` }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ── 2. DANS LE TEMPS ── */}
          {historique.some((h) => h.encaisseTTC > 0) && (
            <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-jakarta text-lg font-bold text-aubergine">Dans le temps</h2>
                <p className="text-xs text-mention">encaissé TTC, toutes sources · cliquez un mois</p>
              </div>
              <ul className="mt-4 grid grid-cols-6 items-end gap-2">
                {historique.map((h) => {
                  const actif = h.cle === moisActif;
                  const hauteur = Math.max(4, Math.round((h.encaisseTTC / maxHistorique) * 96));
                  return (
                    <li key={h.cle} className="flex flex-col items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold tabular-nums ${actif ? "text-aubergine" : "text-mention"}`}
                      >
                        {h.encaisseTTC > 0 ? eurosRonds(h.encaisseTTC) : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMoisChoisi(h.cle)}
                        aria-label={libelleMois(h.cle)}
                        title={libelleMois(h.cle)}
                        className={`w-full rounded-t-lg transition ${actif ? "bg-aubergine" : "bg-gold/50 hover:bg-gold"}`}
                        style={{ height: `${hauteur}px` }}
                      />
                      <span
                        className={`text-[11px] capitalize ${actif ? "font-semibold text-aubergine" : "text-mention"}`}
                      >
                        {libelleMois(h.cle).split(" ")[0].slice(0, 4)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* L'année — le chiffre qu'on cherche au moment de la déclaration */}
              {annee && annee.cumul > 0 && (
                <p className="mt-4 border-t border-dashed border-greige/60 pt-3 text-sm text-ink">
                  {annee.anneeEnCours ? "Depuis janvier" : `Année ${annee.an}`} :{" "}
                  <span className="font-bold tabular-nums text-aubergine">{eurosRonds(annee.cumul)}</span>{" "}
                  encaissés, <span className="font-semibold tabular-nums">{eurosRonds(annee.netCumul)}</span> net
                  {annee.anneeEnCours && annee.tous.length > 1 && (
                    <span className="text-mention">
                      {" "}
                      · à ce rythme, l&apos;année finirait vers{" "}
                      <span className="font-semibold text-ink">≈ {eurosRonds(annee.projection)}</span>
                    </span>
                  )}
                </p>
              )}
            </section>
          )}

          {/* ── 3. LE DÉTAIL, DE L'ENCAISSÉ AU NET ── */}
          <section className="mt-4 overflow-hidden rounded-3xl border border-greige/50 bg-ivory shadow-soft">
            <h2 className="px-5 pt-5 font-jakarta text-lg font-bold text-aubergine">Le détail</h2>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {[
                  { l: "Encaissé TTC", v: mois.encaisseTTC, fort: true },
                  ...(mois.nbCalendly > 0 && mois.nbFacturees > 0
                    ? [
                        { l: `dont rendez-vous Calendly (${mois.nbCalendly})`, v: mois.encaisseCalendly, intermediaire: true },
                        { l: `dont appels à la minute (${mois.nbFacturees})`, v: mois.encaisseAppels, intermediaire: true },
                      ]
                    : []),
                  ...(reglages.tvaActive
                    ? [
                        { l: `TVA collectée (${reglages.tvaTaux} %)`, v: -mois.tvaCollectee },
                        { l: "Chiffre d'affaires HT", v: mois.encaisseHT, fort: true, intermediaire: true },
                      ]
                    : []),
                  {
                    l: `Frais Stripe (${mois.nbRecharges} recharge${mois.nbRecharges > 1 ? "s" : ""}${
                      mois.nbCalendly > 0 ? ` + ${mois.nbCalendly} Calendly` : ""
                    })`,
                    v: -mois.fraisStripe,
                  },
                  { l: `Frais Twilio (${Math.round(mois.minutes)} min)`, v: -mois.fraisTwilio },
                  { l: "Coûts fixes", v: -mois.coutsFixes },
                  { l: `URSSAF (${reglages.urssaf} %${reglages.tvaActive ? " du HT" : ""})`, v: -mois.urssaf },
                  { l: `Impôt (${reglages.impot} %${reglages.tvaActive ? " du HT" : ""})`, v: -mois.impot },
                ].map((r) => (
                  <tr
                    key={r.l}
                    className={`border-b border-greige/40 ${"intermediaire" in r && r.intermediaire ? "bg-cream/60" : ""}`}
                  >
                    <td className="px-5 py-2.5 text-ink">{r.l}</td>
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
                  <td className="px-5 py-3 font-bold text-aubergine">= Net estimé</td>
                  <td className="px-3 py-3 text-right text-xs text-mention">{pct(mois.net)}</td>
                  <td className="px-5 py-3 text-right text-lg font-bold tabular-nums text-statut-online">
                    {euros(mois.net)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="border-t border-greige/40 px-5 py-3 text-xs text-mention">
              Frais Stripe et Twilio estimés (1,5 % + 0,25 € par paiement · 0,03 €/min). Les taux se
              changent dans les réglages, en bas de page.
            </p>
          </section>

          {/* ── 4. PAR FORMULE ── */}
          {parFormule.length > 0 && (
            <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-jakarta text-lg font-bold text-aubergine">Par formule</h2>
                <p className="text-xs text-mention">et ce que chaque consultation vous laisse vraiment</p>
              </div>
              <ul className="mt-3 space-y-3">
                {parFormule.map(([formule, d]) => {
                  const part = mois.encaisseTTC > 0 ? (d.total / mois.encaisseTTC) * 100 : 0;
                  const netChacune = (d.total / d.nb) * ratioNet;
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
                          <span className="text-xs font-normal text-mention">{Math.round(part)} %</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-greige/40">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${part}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-mention">
                        ≈ <span className="font-semibold tabular-nums text-ink">{euros(netChacune)}</span> net
                        chacune, après TVA, cotisations, frais et coûts fixes
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ── 5. INDICATEURS DE SANTÉ ── */}
          <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
            <h2 className="font-jakarta text-lg font-bold text-aubergine">Indicateurs de santé</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">Panier consultation</p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {euros(mois.panierConsultation)}
                </p>
                <p className="text-xs text-mention">
                  {mois.nbFacturees + mois.nbCalendly} facturée{mois.nbFacturees + mois.nbCalendly > 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">Clientes du mois</p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {mois.clientes.size}
                </p>
                <p className="text-xs text-mention">
                  {nouvellesClientes > 0
                    ? `dont ${nouvellesClientes} nouvelle${nouvellesClientes > 1 ? "s" : ""}`
                    : "aucune nouvelle ce mois-ci"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">Revenu par minute</p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {mois.minutes > 0 ? euros(mois.revenuParMinute) : "—"}
                </p>
                <p className="text-xs text-mention">
                  {mois.minutes > 0
                    ? "appels à la minute · théorique 2,90 €"
                    : "aucun appel à la minute ce mois-ci"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">Crédit en circulation</p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                  {euros(creditEnCirculation)}
                </p>
                <p className="text-xs text-mention">déposé, pas encore utilisé</p>
              </div>
            </div>
          </section>

          {/* ── 6. RÉGLAGES — repliés : on les touche deux fois par an ── */}
          <details className="mt-4 rounded-3xl border border-greige/50 bg-ivory shadow-soft">
            <summary className="cursor-pointer list-none px-6 py-4">
              <span className="font-jakarta text-lg font-bold text-aubergine">Réglages</span>
              <span className="ml-3 text-xs text-mention">
                TVA {reglages.tvaActive ? `${reglages.tvaTaux} %` : "non"} · URSSAF {reglages.urssaf} % · impôt{" "}
                {reglages.impot} % · coûts fixes {eurosRonds(reglages.coutsFixes)}
                {objectif > 0 ? ` · objectif ${eurosRonds(objectif)}` : ""}
              </span>
            </summary>
            <div className="grid gap-x-8 gap-y-4 border-t border-greige/40 px-6 pb-6 pt-4 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 text-sm text-ink">
                Je suis assujettie à la TVA
                <input
                  type="checkbox"
                  checked={reglages.tvaActive}
                  onChange={(e) => majReglage("tvaActive", e.target.checked)}
                  className="h-4 w-4 rounded border-greige accent-cta"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-ink">
                Taux de TVA
                <span className="flex items-center gap-1 text-xs text-mention">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.1}
                    value={reglages.tvaTaux}
                    disabled={!reglages.tvaActive}
                    onChange={(e) => majReglage("tvaTaux", Number(e.target.value))}
                    className={`${champReglage} disabled:opacity-40`}
                  />
                  %
                </span>
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-ink">
                Cotisations URSSAF
                <span className="flex items-center gap-1 text-xs text-mention">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={0.1}
                    value={reglages.urssaf}
                    onChange={(e) => majReglage("urssaf", Number(e.target.value))}
                    className={champReglage}
                  />
                  %
                </span>
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-ink">
                Provision pour l&apos;impôt
                <span className="flex items-center gap-1 text-xs text-mention">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={0.1}
                    value={reglages.impot}
                    onChange={(e) => majReglage("impot", Number(e.target.value))}
                    className={champReglage}
                  />
                  %
                </span>
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-ink">
                Coûts fixes mensuels
                <span className="flex items-center gap-1 text-xs text-mention">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={reglages.coutsFixes}
                    onChange={(e) => majReglage("coutsFixes", Number(e.target.value))}
                    className={champReglage}
                  />
                  €
                </span>
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-ink">
                <span>
                  Objectif d&apos;encaissement du mois
                  <span className="block text-xs text-mention">0 = pas d&apos;objectif affiché</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-mention">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={reglages.objectifMensuel}
                    onChange={(e) => majReglage("objectifMensuel", Number(e.target.value))}
                    className={champReglage}
                  />
                  €
                </span>
              </label>
            </div>
          </details>

          <p className="mt-4 text-xs text-mention">
            Estimations de pilotage — vos pièces officielles restent Stripe, Calendly et vos relevés
            bancaires. Le détail appel par appel se trouve dans le{" "}
            <a href="/cabinet-ew/journal" className="text-prix hover:underline">
              journal
            </a>
            .
          </p>
        </>
      )}
    </CabinetShell>
  );
}
