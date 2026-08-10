"use client";

import { useEffect, useState } from "react";
import {
  signeAstrologique,
  formatDateNaissance,
  signeParCode,
} from "@/lib/astro";

interface ProcheCabinet {
  prenom: string;
  dateNaissance: string | null;
  ascendant: string | null;
  lien: string;
}

export interface AppelEnCours {
  clienteId: string | null;
  prenom: string;
  dateNaissance: string | null;
  ascendant: string | null;
  soldeMinutes: number;
  connecte: boolean;
  depuis: string | null;
  proches: ProcheCabinet[];
}

const LIEN_LABELS: Record<string, string> = {
  compagnon: "Compagnon / compagne",
  ex: "Ex",
  mere: "Mère",
  pere: "Père",
  enfant: "Enfant",
  ami: "Ami(e)",
  autre: "Autre",
};

function chrono(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Bandeau de consultation en cours — la carte la plus importante du
// cabinet quand le téléphone sonne : qui appelle, depuis combien de
// temps, et combien de crédit il lui reste.
export default function BandeauAppelEnCours({ appel }: { appel: AppelEnCours }) {
  const [ecoulees, setEcoulees] = useState(0);

  // Chrono vivant : recalculé chaque seconde depuis l'heure de début
  // renvoyée par le serveur (pas de dérive d'horloge cumulée).
  useEffect(() => {
    if (!appel.depuis) {
      setEcoulees(0);
      return;
    }
    const debut = new Date(appel.depuis).getTime();
    const tick = () =>
      setEcoulees(Math.max(0, Math.floor((Date.now() - debut) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [appel.depuis]);

  const signe = signeAstrologique(appel.dateNaissance);
  const asc = signeParCode(appel.ascendant);

  // Le débit n'a lieu qu'à la fin de l'appel : on estime ici ce qui
  // sera consommé, minute entamée comprise (franchise sous 60 s).
  const minutesConsommees = ecoulees < 60 ? 0 : Math.ceil(ecoulees / 60);
  const minutesRestantes = Math.max(0, appel.soldeMinutes - minutesConsommees);
  const bientotFini = appel.connecte && minutesRestantes <= 2;

  return (
    <section
      className={`rounded-3xl border-2 p-6 shadow-soft transition-colors sm:p-7 ${
        bientotFini
          ? "border-cta bg-cta/5"
          : appel.connecte
          ? "border-statut-online/40 bg-green-50/40"
          : "border-amber-300 bg-amber-50/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
            {appel.connecte ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-statut-online" />
                </span>
                Consultation en cours
              </>
            ) : (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                Appel entrant — ça sonne
              </>
            )}
          </p>

          <p className="mt-1.5 font-serif text-3xl font-semibold text-aubergine">
            {appel.clienteId ? (
              <a
                href={`/cabinet-ew/clientes/${appel.clienteId}`}
                className="transition hover:text-cta"
              >
                {appel.prenom}
              </a>
            ) : (
              appel.prenom
            )}
          </p>

          {(signe || asc || appel.dateNaissance) && (
            <p className="mt-0.5 text-sm text-ink">
              {[
                signe ? `${signe.emoji} ${signe.nom}` : null,
                asc ? `asc. ${asc.nom}` : null,
                appel.dateNaissance
                  ? `née le ${formatDateNaissance(appel.dateNaissance)}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        {/* Chrono + crédit restant */}
        <div className="flex shrink-0 gap-6 text-right">
          {appel.connecte && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Depuis
              </p>
              <p className="font-serif text-3xl font-semibold tabular-nums text-aubergine">
                {chrono(ecoulees)}
              </p>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
              Crédit restant
            </p>
            <p
              className={`font-serif text-3xl font-semibold tabular-nums ${
                bientotFini ? "text-prix" : "text-aubergine"
              }`}
            >
              {minutesRestantes}
              <span className="ml-1 text-base font-normal text-mention">min</span>
            </p>
          </div>
        </div>
      </div>

      {bientotFini && (
        <p className="mt-4 rounded-xl bg-cta/10 px-4 py-2.5 text-sm font-medium text-prix">
          ⏳ Il ne lui reste que {minutesRestantes} min de crédit — la
          communication sera coupée à la fin.
        </p>
      )}

      {(appel.proches?.length ?? 0) > 0 && (
        <div className="mt-5 border-t border-greige/60 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
            Les personnes qui comptent
          </p>
          <ul className="mt-2 space-y-1">
            {appel.proches.map((p, i) => {
              const s = signeAstrologique(p.dateNaissance);
              const a = signeParCode(p.ascendant);
              return (
                <li key={i} className="text-sm text-aubergine">
                  <span className="font-medium">{p.prenom}</span>
                  <span className="text-mention">
                    {" · "}
                    {[
                      LIEN_LABELS[p.lien] || "Autre",
                      p.dateNaissance ? formatDateNaissance(p.dateNaissance) : null,
                      s ? `${s.emoji} ${s.nom}` : null,
                      a ? `asc. ${a.nom}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
