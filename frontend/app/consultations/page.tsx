"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceNav from "@/components/EspaceNav";

interface Consultation {
  id: string;
  status: string;
  type: string;
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
    <div className="mx-auto max-w-3xl px-5 py-10 font-jakarta">
      <EspaceNav />

      {/* Le chemin vit ICI, et seulement ici — l'accueil ne le montre plus.
          Un seul endroit pour l'histoire, sinon la cliente ne sait pas
          lequel fait foi. */}
      <h1 className="mt-8 font-serif text-3xl font-semibold text-aubergine">
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
      <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-ink">
        <span aria-hidden className="mr-1.5">
          ✦
        </span>
        La facturation démarre à la première minute de communication. Un appel
        interrompu avant 60&nbsp;secondes ne vous est jamais facturé.
      </p>

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

      {!chargement && !erreur && tenues.length > 0 && (
        <div className="mt-8 space-y-3">
          {tenues.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-greige/60 bg-ivory p-5 shadow-soft"
            >
              <div>
                <p className="font-serif text-lg font-semibold text-aubergine">
                  {c.formule}
                </p>
                <p className="mt-0.5 text-sm text-mention">
                  {formatDate(c.startedAt || c.createdAt)}
                </p>
                <p className="mt-1 text-sm text-ink">
                  Durée : {formatDuree(c.durationSeconds)}
                </p>
                {/* TRANSPARENCE DU CALCUL — sans cette ligne, une cliente
                    lit « 9 min 49 » puis « 29,00 € » et conclut à une
                    erreur : 29 € pour dix minutes, alors qu'elle n'a pas
                    parlé dix minutes. La règle de la minute entamée est
                    annoncée avant l'appel ; elle doit être rappelée là où
                    le montant apparaît, pas seulement en amont. */}
                {detailFacturation(c) && (
                  <p className="mt-0.5 text-xs text-mention">
                    {detailFacturation(c)}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                {c.montant === 0 ? (
                  // Franchise de connexion : appel coupé sous 60 s → 0 €
                  <>
                    <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                      Non facturée
                    </span>
                    <p className="mt-1 text-xs text-mention">
                      moins d&apos;une minute
                    </p>
                  </>
                ) : (
                  <span className="font-serif text-xl font-semibold text-prix">
                    {c.montant != null ? euros(c.montant) : "—"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
