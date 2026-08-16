"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";
import RendezVousDuJour from "@/components/RendezVousDuJour";

// CALENDLY — les rendez-vous, tous, à leur place.
//
// Règle d'Elena : « la page d'arrivée sert ce que je fais tous les jours,
// un onglet sert ce que je fais toutes les semaines. » L'accueil garde
// le jour ; ici vivent « à rattraper » (huit personnes en attente, ça
// mérite une page, pas un coin), et les rendez-vous de la semaine.

interface RendezVous {
  id: string;
  client_id: string | null;
  prenom: string;
  formule: string | null;
  minutes: number | null;
  debut: string;
  statut: "prevu" | "honore" | "annule";
  montant_paye: number | null;
}

function jourISO(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function jourLong(iso: string): string {
  const d = new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export default function CalendlyPage() {
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [aVenir, setAVenir] = useState<RendezVous[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    // Les 7 prochains jours, hors aujourd'hui (porté par « Ma journée »)
    const jours: string[] = [];
    for (let i = 1; i <= 7; i++) {
      jours.push(jourISO(new Date(Date.now() + i * 86_400_000)));
    }
    Promise.all(jours.map((j) => api.adminGetRendezVous(j).catch(() => null)))
      .then((reponses) => {
        const tous = reponses
          .filter(Boolean)
          .flatMap((r) => (r as { duJour: RendezVous[] }).duJour || [])
          .filter((r) => r.statut === "prevu")
          .sort((a, b) => a.debut.localeCompare(b.debut));
        setAVenir(tous);
      })
      .catch(() => setAccesRefuse(true))
      .finally(() => setCharge(true));
  }, []);

  if (accesRefuse) notFound();

  // Groupé par jour pour se lire comme un agenda
  const parJour = new Map<string, RendezVous[]>();
  for (const r of aVenir) {
    const cle = jourLong(r.debut);
    if (!parJour.has(cle)) parJour.set(cle, []);
    parJour.get(cle)!.push(r);
  }

  return (
    <CabinetShell>
      <CabinetNav />

      <div className="mt-6">
        <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">
          Rendez-vous Calendly
        </h1>
        <p className="mt-1 text-sm text-mention">
          Les réservations arrivent ici toutes seules. Un rendez-vous ne
          disparaît jamais tant que la consultation n&apos;a pas eu lieu.
        </p>
      </div>

      {/* Aujourd'hui + à rattraper — le composant complet */}
      <RendezVousDuJour mode="complet" />

      {/* La semaine à venir */}
      <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
        <h2 className="font-jakarta text-lg font-bold text-aubergine">
          Les 7 prochains jours
        </h2>
        {!charge ? (
          <p className="mt-3 text-sm text-mention">Chargement…</p>
        ) : parJour.size === 0 ? (
          <p className="mt-3 text-sm text-mention">
            Aucun rendez-vous réservé pour la semaine à venir.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {[...parJour.entries()].map(([jour, liste]) => (
              <div key={jour}>
                <p className="text-xs font-bold uppercase tracking-wider text-mention">
                  {jour}
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {liste.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-greige/50 bg-white px-4 py-2.5 text-sm"
                    >
                      <span className="w-12 shrink-0 font-bold tabular-nums text-aubergine">
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
                        <span className="font-medium text-aubergine">
                          {r.prenom}{" "}
                          <span className="text-xs font-normal text-mention">
                            (fiche à rattacher)
                          </span>
                        </span>
                      )}
                      <span className="text-mention">
                        · {r.formule || "Forfait"}
                        {r.minutes ? ` ${r.minutes} min` : ""}
                        {r.montant_paye ? ` · ${r.montant_paye} € payés` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </CabinetShell>
  );
}
