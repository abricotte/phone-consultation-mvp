"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// « Mes rendez-vous du jour » — le vrai gain de l'intégration Calendly :
// piloter sa journée depuis un seul écran plutôt que depuis sa boîte mail.
// ~5 forfaits par jour, 25 par semaine.
//
// Règle qui structure tout : RIEN ne disparaît sans qu'Elena l'ait décidé.
// Un rendez-vous dont l'heure est passée devient « à rattraper », il ne
// s'efface pas. Un appel lancé mais raté laisse une trace et reste là.

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

export default function RendezVousDuJour() {
  const [duJour, setDuJour] = useState<RendezVous[]>([]);
  const [enRetard, setEnRetard] = useState<RendezVous[]>([]);
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
      // Silence volontaire : tant que la table n'existe pas (migration non
      // appliquée), cet encart s'efface au lieu d'afficher une erreur.
      .catch(() => {
        setDuJour([]);
        setEnRetard([]);
      })
      .finally(() => setCharge(true));
  }

  useEffect(recharger, []);

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

  // Rien à montrer : pas d'encart vide qui occupe l'écran pour rien.
  if (!charge || (duJour.length === 0 && enRetard.length === 0)) return null;

  const aVenir = duJour.filter((r) => r.statut === "prevu");
  const faits = duJour.filter((r) => r.statut === "honore");

  function Ligne({ r, grise }: { r: RendezVous; grise?: boolean }) {
    return (
      <li
        className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 ${
          grise ? "border-greige/40 bg-greige/10" : "border-greige/50 bg-white"
        }`}
      >
        <span
          className={`w-14 shrink-0 text-lg font-bold tabular-nums ${
            grise ? "text-mention" : "text-aubergine"
          }`}
        >
          {heure(r.debut)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-bold text-aubergine">
            {r.client_id ? (
              <a href={`/cabinet-ew/clientes/${r.client_id}`} className="hover:underline">
                {r.prenom}
              </a>
            ) : (
              <>
                {r.prenom}{" "}
                <span className="text-xs font-normal text-mention">(fiche à rattacher)</span>
              </>
            )}
          </span>
          <span className="block text-xs text-mention">
            {r.formule || "Forfait"}
            {r.minutes ? ` · ${r.minutes} min` : ""}
            {r.tentatives > 0 && (
              <span className="text-red-600">
                {" "}
                · {r.tentatives} tentative{r.tentatives > 1 ? "s" : ""}
                {r.derniere_tentative ? ` à ${heure(r.derniere_tentative)}` : ""}
              </span>
            )}
          </span>
        </span>

        {r.statut === "honore" ? (
          <span className="text-xs font-medium text-green-700">✓ Consultation faite</span>
        ) : (
          <button
            type="button"
            onClick={() => lancer(r)}
            disabled={lancement !== null}
            className="shrink-0 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-text transition hover:opacity-90 disabled:opacity-40"
          >
            {lancement === r.id ? "Appel en cours…" : "Lancer l'appel"}
          </button>
        )}
      </li>
    );
  }

  return (
    <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
      <h2 className="font-jakarta text-lg font-bold text-aubergine">
        Mes rendez-vous du jour
      </h2>

      {message && (
        <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>
      )}
      {erreur && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{erreur}</p>
      )}

      {aVenir.length > 0 && (
        <ul className="mt-4 space-y-2">
          {aVenir.map((r) => (
            <Ligne key={r.id} r={r} grise={r.aRattraper} />
          ))}
        </ul>
      )}

      {aVenir.length === 0 && faits.length > 0 && (
        <p className="mt-3 text-sm text-mention">
          Tous vos rendez-vous du jour sont honorés.
        </p>
      )}

      {faits.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-mention hover:text-aubergine">
            {faits.length} consultation{faits.length > 1 ? "s" : ""} déjà faite
            {faits.length > 1 ? "s" : ""}
          </summary>
          <ul className="mt-2 space-y-2">
            {faits.map((r) => (
              <Ligne key={r.id} r={r} grise />
            ))}
          </ul>
        </details>
      )}

      {/* Les oubliés des jours précédents — jamais effacés en silence. */}
      {enRetard.length > 0 && (
        <div className="mt-5 border-t border-greige/50 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
            ✦ À rattraper
          </p>
          <p className="mt-1 text-xs text-mention">
            Ces rendez-vous sont passés sans que la consultation ait eu lieu.
          </p>
          <ul className="mt-3 space-y-2">
            {enRetard.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-mention">
                  {jourCourt(r.debut)}
                </span>
                <span className="min-w-0 flex-1">
                  <Ligne r={r} grise />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
