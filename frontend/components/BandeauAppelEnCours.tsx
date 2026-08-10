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

interface NoteBandeau {
  contenu: string;
  aSuivre: boolean;
  echeance: string | null;
  close: boolean;
  createdAt: string;
}

export interface AppelEnCours {
  clienteId: string | null;
  prenom: string;
  dateNaissance: string | null;
  ascendant: string | null;
  soldeMinutes: number;
  connecte: boolean;
  depuis: string | null;
  derniereConsultation: string | null;
  notes: NoteBandeau[];
  proches: ProcheCabinet[];
}

// "il y a 3 semaines", "hier", "il y a 5 mois"
function depuisQuand(iso: string): string {
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} jours`;
  if (jours < 31) {
    const s = Math.round(jours / 7);
    return `il y a ${s} semaine${s > 1 ? "s" : ""}`;
  }
  const m = Math.round(jours / 30);
  if (m < 12) return `il y a ${m} mois`;
  const a = Math.floor(m / 12);
  return `il y a ${a} an${a > 1 ? "s" : ""}`;
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

      {/* PENSE-BÊTE : sa dernière venue et vos dernières notes, sous les
          yeux avant même de décrocher. */}
      {(appel.derniereConsultation || (appel.notes?.length ?? 0) > 0) && (
        <div className="mt-5 rounded-2xl border border-gold/40 bg-gold/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark">
            ✦ Avant de décrocher
          </p>

          {appel.derniereConsultation ? (
            <p className="mt-1 text-sm text-ink">
              Dernière consultation{" "}
              <strong className="font-semibold text-aubergine">
                {depuisQuand(appel.derniereConsultation)}
              </strong>
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink">
              <strong className="font-semibold text-aubergine">
                Première consultation
              </strong>{" "}
              — vous ne vous êtes jamais parlé.
            </p>
          )}

          {(appel.notes?.length ?? 0) > 0 && (
            <ul className="mt-2 space-y-1.5">
              {appel.notes.map((n, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span aria-hidden className="mt-0.5 shrink-0 text-gold-dark">
                    ·
                  </span>
                  <span className={n.close ? "text-mention line-through" : "text-ink"}>
                    {n.contenu}
                    {n.aSuivre && !n.close && (
                      <span className="ml-1.5 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold-dark">
                        à suivre
                        {n.echeance &&
                          ` · ${new Date(n.echeance).toLocaleDateString("fr-FR", {
                            month: "long",
                            year: "numeric",
                          })}`}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {appel.clienteId && (
            <a
              href={`/cabinet-ew/clientes/${appel.clienteId}`}
              className="mt-2 inline-block text-xs font-medium text-prix hover:underline"
            >
              Ouvrir son carnet →
            </a>
          )}
        </div>
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
