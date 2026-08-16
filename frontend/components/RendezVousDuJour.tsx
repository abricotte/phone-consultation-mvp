"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { signeAstrologique } from "@/lib/astro";

// « MA JOURNÉE » — le poste de pilotage du cabinet, validé sur croquis.
//
// Un seul principe : ce dont Elena a besoin en ouvrant son cabinet le
// matin, dans l'ordre où elle en a besoin. Le prochain rendez-vous en
// grand — avec ce que la cliente veut aborder, lu AVANT de décrocher —
// puis le reste de la journée, les dates qui comptent, et ce qui est
// resté en chemin.
//
// Règle inchangée : RIEN ne disparaît sans qu'Elena l'ait décidé. Un
// rendez-vous dont l'heure est passée descend en « à rattraper », il ne
// s'efface pas. Et contrairement à la première version, le bloc reste
// visible même vide — une journée libre se lit, elle ne se devine pas.

interface RendezVous {
  id: string;
  client_id: string | null;
  telephone: string | null;
  prenom: string;
  formule: string | null;
  forfait_code: string | null;
  minutes: number | null;
  debut: string;
  statut: "prevu" | "honore" | "annule";
  montant_paye: number | null;
  tentatives: number;
  derniere_tentative: string | null;
  aRattraper: boolean;
  /** « Ce qu'elle veut aborder » — écrit par la cliente pour la séance */
  aAborder: string | null;
  dateNaissance: string | null;
}

interface Evenement {
  type: "anniversaire_cliente" | "anniversaire_proche" | "date_marquante";
  clienteId?: string;
  cliente?: string;
  libelle: string;
  jours: number;
}

function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function jourCourt(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  });
}

/** « Mardi 11 août » — l'en-tête du bloc */
function dateDuJour(): string {
  const d = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** « dans 42 min », « dans 2 h 05 », « maintenant » */
function compteARebours(iso: string): string {
  const min = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (min <= 1) return "maintenant";
  if (min < 60) return `dans ${min} min`;
  const h = Math.floor(min / 60);
  const reste = min % 60;
  return `dans ${h} h${reste > 0 ? ` ${String(reste).padStart(2, "0")}` : ""}`;
}

export default function RendezVousDuJour() {
  const [duJour, setDuJour] = useState<RendezVous[]>([]);
  const [enRetard, setEnRetard] = useState<RendezVous[]>([]);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [charge, setCharge] = useState(false);
  const [lancement, setLancement] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  function recharger() {
    api
      .adminGetRendezVous()
      .then((r: { duJour: RendezVous[]; enRetard: RendezVous[] }) => {
        setDuJour(r.duJour || []);
        setEnRetard(r.enRetard || []);
      })
      // Silence : tant que la migration n'est pas passée, le bloc reste
      // sobre au lieu d'afficher une erreur.
      .catch(() => {
        setDuJour([]);
        setEnRetard([]);
      })
      .finally(() => setCharge(true));

    // Aujourd'hui et demain seulement : le bloc pilote la journée, pas
    // le trimestre — la fenêtre large vit dans les fiches.
    api
      .adminGetDatesAVenir(2)
      .then((e: Evenement[]) => setEvenements((e || []).filter((x) => x.jours <= 1)))
      .catch(() => setEvenements([]));
  }

  useEffect(() => {
    recharger();
    // Le compte à rebours doit rester juste sans rechargement manuel.
    const id = setInterval(recharger, 60_000);
    return () => clearInterval(id);
  }, []);

  async function lancer(r: RendezVous) {
    if (!r.telephone) {
      setErreur(`${r.prenom} n'a pas laissé de numéro — appelez-la depuis sa fiche.`);
      return;
    }
    setLancement(r.id);
    setErreur("");
    setMessage("");
    try {
      const res = await api.adminLancerForfait({
        telephone: r.telephone,
        forfaitCode: r.forfait_code,
        rendezVousId: r.id,
      });
      setMessage(res?.message || "Appel lancé.");
      recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLancement(null);
    }
  }

  if (!charge) return null;

  // Le prochain = le premier rendez-vous encore à venir. Ceux dont
  // l'heure est passée descendent en « à rattraper » : ils ne sont plus
  // la prochaine chose à faire, mais ils ne s'effacent pas pour autant.
  const aVenir = duJour.filter((r) => r.statut === "prevu" && !r.aRattraper);
  const prochain = aVenir[0] ?? null;
  const ensuite = aVenir.slice(1);
  const faits = duJour.filter((r) => r.statut === "honore");
  const aRattraper = [
    ...duJour.filter((r) => r.statut === "prevu" && r.aRattraper),
    ...enRetard,
  ];

  const duJourEvts = evenements.filter((e) => e.jours === 0);
  const demainEvts = evenements.filter((e) => e.jours === 1);

  function libelleEvenement(e: Evenement): string {
    if (e.type === "date_marquante") {
      return `« ${e.libelle} »${e.cliente ? ` — ${e.cliente}` : ""}`;
    }
    return e.libelle + (e.cliente ? ` (cliente : ${e.cliente})` : "");
  }

  return (
    <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
      <h2 className="font-jakarta text-lg font-bold text-aubergine">
        {dateDuJour()}
      </h2>

      {message && (
        <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>
      )}
      {erreur && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{erreur}</p>
      )}

      {/* LE PROCHAIN — en grand, avec ce qu'elle veut aborder */}
      {prochain ? (
        <div className="mt-4 rounded-2xl border border-aubergine/20 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-mention">
            ▶ Prochain
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-aubergine">
            {prochain.prenom}
            {signeAstrologique(prochain.dateNaissance) && (
              <span className="ml-2 text-base font-medium text-mention">
                {signeAstrologique(prochain.dateNaissance)!.emoji}{" "}
                {signeAstrologique(prochain.dateNaissance)!.nom}
              </span>
            )}
            <span className="text-mention"> · </span>
            {heure(prochain.debut)}
            <span className="ml-2 text-base font-medium text-prix">
              ({compteARebours(prochain.debut)})
            </span>
          </p>
          <p className="mt-0.5 text-sm text-mention">
            {prochain.formule || "Forfait"}
            {prochain.minutes ? ` · ${prochain.minutes} min` : ""}
            {prochain.montant_paye ? " · payé sur Calendly" : ""}
            {prochain.tentatives > 0 && (
              <span className="text-red-600">
                {" "}
                · {prochain.tentatives} tentative{prochain.tentatives > 1 ? "s" : ""} déjà
              </span>
            )}
          </p>

          {/* Ce qu'elle veut aborder — lu AVANT de décrocher. */}
          {prochain.aAborder && (
            <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-sm italic leading-relaxed text-ink">
              ✦ « {prochain.aAborder.length > 180
                ? prochain.aAborder.slice(0, 180) + "…"
                : prochain.aAborder} »
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => lancer(prochain)}
              disabled={lancement !== null}
              className="rounded-full bg-cta px-5 py-2 text-sm font-medium text-cta-text transition hover:opacity-90 disabled:opacity-40"
            >
              {lancement === prochain.id ? "Appel en cours…" : "Lancer l'appel"}
            </button>
            {prochain.client_id && (
              <a
                href={`/cabinet-ew/clientes/${prochain.client_id}`}
                className="text-sm text-prix hover:underline"
              >
                voir sa fiche
              </a>
            )}
            {!prochain.client_id && (
              <span className="text-xs text-mention">(fiche à rattacher)</span>
            )}
          </div>
        </div>
      ) : (
        // Une journée libre se LIT — le bloc ne s'efface plus.
        <p className="mt-3 text-sm text-mention">
          {faits.length > 0
            ? "Tous vos rendez-vous du jour sont honorés."
            : "Aucun rendez-vous aujourd'hui."}
        </p>
      )}

      {/* ENSUITE — le reste de la journée, compact */}
      {ensuite.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {ensuite.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-mention">Ensuite :</span>
              <span className="font-bold tabular-nums text-aubergine">
                {heure(r.debut)}
              </span>
              {r.client_id ? (
                <a
                  href={`/cabinet-ew/clientes/${r.client_id}`}
                  className="font-medium text-aubergine hover:underline"
                >
                  {r.prenom}
                </a>
              ) : (
                <span className="font-medium text-aubergine">{r.prenom}</span>
              )}
              <span className="text-mention">
                · {r.formule || "Forfait"}
                {r.minutes ? ` ${r.minutes} min` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* LES DATES QUI COMPTENT — aujourd'hui et demain seulement */}
      {(duJourEvts.length > 0 || demainEvts.length > 0) && (
        <ul className="mt-4 space-y-1 border-t border-greige/40 pt-3">
          {duJourEvts.map((e, i) => (
            <li key={`j${i}`} className="text-sm text-ink">
              <span className="text-gold-dark">✦</span>{" "}
              <span className="font-medium">Aujourd&apos;hui :</span>{" "}
              {libelleEvenement(e)}
            </li>
          ))}
          {demainEvts.map((e, i) => (
            <li key={`d${i}`} className="text-sm text-mention">
              <span className="text-gold-dark">◈</span>{" "}
              <span className="font-medium">Demain :</span> {libelleEvenement(e)}
            </li>
          ))}
        </ul>
      )}

      {/* À RATTRAPER — jamais effacé en silence */}
      {aRattraper.length > 0 && (
        <div className="mt-4 border-t border-greige/40 pt-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
            À rattraper
          </p>
          <ul className="mt-2 space-y-1.5">
            {aRattraper.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-mention">
                  {jourCourt(r.debut)}, {heure(r.debut)}
                </span>
                {r.client_id ? (
                  <a
                    href={`/cabinet-ew/clientes/${r.client_id}`}
                    className="font-medium text-aubergine hover:underline"
                  >
                    {r.prenom}
                  </a>
                ) : (
                  <span className="font-medium text-aubergine">{r.prenom}</span>
                )}
                {signeAstrologique(r.dateNaissance) && (
                  <span className="text-xs text-mention">
                    {signeAstrologique(r.dateNaissance)!.emoji}{" "}
                    {signeAstrologique(r.dateNaissance)!.nom}
                  </span>
                )}
                {r.tentatives > 0 && (
                  <span className="text-xs text-red-600">
                    {r.tentatives} tentative{r.tentatives > 1 ? "s" : ""}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => lancer(r)}
                  disabled={lancement !== null}
                  className="text-xs text-prix underline-offset-2 hover:underline disabled:opacity-40"
                >
                  {lancement === r.id ? "appel…" : "lancer l'appel"}
                </button>
                {/* Ce qu'elle veut aborder — a rattraper se prepare comme
                    le prochain : Elena doit savoir ce qu'on vient chercher. */}
                {r.aAborder && (
                  <span className="basis-full pl-2 text-xs italic text-ink/80">
                    ✦ « {r.aAborder.length > 140 ? r.aAborder.slice(0, 140) + "…" : r.aAborder} »
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Déjà faites — repliées, pour mémoire */}
      {faits.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-mention hover:text-aubergine">
            {faits.length} consultation{faits.length > 1 ? "s" : ""} déjà faite
            {faits.length > 1 ? "s" : ""}
          </summary>
          <ul className="mt-2 space-y-1">
            {faits.map((r) => (
              <li key={r.id} className="text-sm text-mention">
                {heure(r.debut)} · {r.prenom} — ✓ faite
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
