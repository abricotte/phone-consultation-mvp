"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceShell from "@/components/EspaceShell";

interface Consultation {
  id: string;
  status: string;
  type: string;
  origine?: "minute" | "rendez-vous";
  formule: string;
  forfaitMinutes: number | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  montant: number | null;
  createdAt: string;
}

function formatDuree(secondes: number | null): string {
  if (!secondes || secondes <= 0) return "—";
  const min = Math.floor(secondes / 60);
  const sec = secondes % 60;
  if (min === 0) return `${sec} s`;
  return sec > 0 ? `${min} min ${sec.toString().padStart(2, "0")}` : `${min} min`;
}

const euros = (n: number) => n.toFixed(2).replace(".", ",") + " €";

/**
 * Explique le montant d'une consultation à la minute : « 9 min 49 »
 * facturé 29 € semble faux tant qu'on ne dit pas que la dixième minute
 * était entamée. La règle est annoncée avant l'appel, mais c'est ici
 * qu'elle est mise en doute — donc c'est ici qu'elle doit se relire.
 *
 * Le tarif est recalculé depuis le montant réellement débité, jamais
 * depuis le tarif actuel : une consultation ancienne doit continuer de
 * s'expliquer même si les prix ont changé depuis.
 *
 * @returns null pour les forfaits (montant fixe, rien à expliquer) et
 *          les consultations non facturées.
 */
function detailFacturation(c: Consultation): string | null {
  if (!c.montant || c.montant <= 0) return null;
  if (c.type !== "minute") return null;
  if (!c.durationSeconds || c.durationSeconds <= 0) return null;

  const facturees = Math.ceil(c.durationSeconds / 60);
  const reelles = c.durationSeconds / 60;
  const tarif = c.montant / facturees;

  // Durée pile ronde : la mention n'apporterait rien.
  if (Math.abs(facturees - reelles) < 0.017) {
    return `${facturees} min à ${euros(tarif)}/min`;
  }

  return `${facturees} minutes entamées × ${euros(tarif)} — toute minute commencée est due`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  // Une seule histoire, deux origines : à la minute, sur rendez-vous. On filtre, on ne sépare pas.
  const [origine, setOrigine] = useState<"toutes" | "minute" | "rendez-vous">("toutes");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    api
      .getSessionHistory()
      .then((data: Consultation[]) => setConsultations(data))
      .catch((err) => {
        if (err instanceof Error && err.message.includes("Token")) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        setErreur(
          err instanceof Error ? err.message : "Impossible de charger l'historique"
        );
      })
      .finally(() => setChargement(false));
  }, []);

  // On n'affiche que les consultations réellement tenues (avec une durée).
  const tenues = consultations.filter(
    (c) => c.status === "completed" && (c.durationSeconds ?? 0) > 0
  );

  return (
    <EspaceShell>
      <div className="max-w-3xl">

      {/* Le chemin vit ICI, et seulement ici — l'accueil ne le montre plus.
          Un seul endroit pour l'histoire, sinon la cliente ne sait pas
          lequel fait foi. */}
      <h1 className="font-serif text-3xl font-semibold text-aubergine">
        Mon chemin avec Elena
      </h1>
      <p className="mt-2 text-sm text-mention">
        Chacune de vos consultations, dans l&apos;ordre. Le détail de vos
        recharges se trouve dans{" "}
        <a href="/credit" className="text-prix hover:underline">
          Mon crédit
        </a>
        .
      </p>

      {/* Règle de facturation — annoncée clairement, elle rassure autant
          qu'elle informe : une communication écourtée n'est jamais due. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {([["toutes", "Toutes"], ["minute", "À la minute"], ["rendez-vous", "Sur rendez-vous"]] as const).map(([c, l]) => (
          <button key={c} type="button" onClick={() => setOrigine(c)} aria-pressed={origine === c} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${origine === c ? "bg-aubergine text-cream shadow-card" : "border border-greige/60 bg-ivory text-mention hover:border-gold/60"}`}>{l}</button>
        ))}
      </div>
      <details className="mt-3 text-[13px] text-mention">
        <summary className="cursor-pointer hover:text-ink">Comment sont comptées les minutes ?</summary>
        <p className="mt-2 rounded-2xl bg-blush px-4 py-3 text-ink">
          <span aria-hidden className="mr-1.5">✦</span>
          La facturation démarre à la première minute de communication. Un appel
          interrompu avant 60&nbsp;secondes ne vous est jamais facturé.
        </p>
      </details>

      {chargement && (
        <p className="mt-10 text-center text-mention">Chargement…</p>
      )}

      {erreur && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {erreur}
        </p>
      )}

      {!chargement && !erreur && tenues.length === 0 && (
        <div className="mt-8 rounded-2xl border border-greige/60 bg-ivory p-8 text-center shadow-soft">
          <p className="text-ink">Vous n&apos;avez pas encore de consultation.</p>
          <a
            href="/dashboard"
            className="mt-4 inline-block rounded-full bg-cta px-6 py-3 font-medium text-cta-text hover:bg-cta-dark"
          >
            Appeler Elena
          </a>
        </div>
      )}

      {!chargement && !erreur && tenues.length > 0 && (() => {
        // Groupées par mois, en fil : la date à gauche, le reste à droite.
        const parMois = new Map<string, Consultation[]>();
        for (const c of tenues.filter((x) => origine === "toutes" || (x.origine ?? (x.type === "minute" ? "minute" : "rendez-vous")) === origine)) {
          const d = new Date(c.startedAt || c.createdAt);
          const cle = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
          if (!parMois.has(cle)) parMois.set(cle, []);
          parMois.get(cle)!.push(c);
        }
        return (
          <div className="mt-8">
            {[...parMois.entries()].map(([mois, lignes]) => (
              <section key={mois} className="mt-6 first:mt-0">
                <h2 className="font-serif text-[22px] font-semibold capitalize text-aubergine">{mois}</h2>
                <ol className="mt-3 border-l border-greige/80 pl-5">
                  {lignes.map((c) => {
                    const d = new Date(c.startedAt || c.createdAt);
                    return (
                      <li key={c.id} className="relative py-3">
                        <span aria-hidden className="absolute -left-[25px] top-[18px] h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-cream" />
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                          <span className="w-24 shrink-0 text-[13px] text-mention">
                            {d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })} · {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="font-serif text-[18px] font-semibold text-aubergine">{c.formule}</span>
                            <span className="ml-2 text-[13px] text-ink/70">{formatDuree(c.durationSeconds)}</span>
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${(c.origine ?? (c.type === "minute" ? "minute" : "rendez-vous")) === "minute" ? "bg-blush text-aubergine" : "bg-[#FBF3E2] text-gold-dark"}`}>{(c.origine ?? (c.type === "minute" ? "minute" : "rendez-vous")) === "minute" ? "à la minute" : "sur rendez-vous"}</span>
                            {detailFacturation(c) && <span className="block text-[12px] text-mention">{detailFacturation(c)}</span>}
                          </span>
                          <span className="shrink-0 text-right">
                            {c.montant === 0 ? (
                              <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[12px] font-medium text-green-700" title="moins d'une minute">non facturée</span>
                            ) : (
                              <span className="font-serif text-[18px] font-semibold tabular-nums text-aubergine">{c.montant != null ? euros(c.montant) : "—"}</span>
                            )}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        );
      })()}
      </div>
    </EspaceShell>
  );
}
