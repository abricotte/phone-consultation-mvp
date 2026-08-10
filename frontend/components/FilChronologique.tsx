"use client";

import { formatDateNaissance } from "@/lib/astro";

// Fil chronologique unifié d'une cliente : consultations, notes du
// carnet, augures posés et recharges, mêlés par date du plus récent au
// plus ancien. Pour relire l'histoire d'une personne d'un seul regard
// avant de décrocher, au lieu de sauter entre quatre blocs séparés.

export interface EvenementFil {
  type: "consultation" | "note" | "augure" | "recharge";
  date: string;
  /** Texte principal */
  titre: string;
  /** Précision secondaire (durée, échéance…) */
  detail?: string | null;
  /** Montant à droite, si l'événement en porte un */
  montant?: number | null;
  /** Pour les augures : attente | confirme | pas_encore */
  statut?: string | null;
  /** Consultation non facturée (franchise des 60 s) */
  nonFacturee?: boolean;
}

const MARQUEURS: Record<
  EvenementFil["type"],
  { icone: string; classes: string; libelle: string }
> = {
  consultation: { icone: "☎", classes: "bg-blush text-prix", libelle: "Consultation" },
  note: { icone: "✎", classes: "bg-gold/15 text-gold-dark", libelle: "Note" },
  augure: { icone: "✦", classes: "bg-gold/25 text-gold-dark", libelle: "Augure" },
  recharge: { icone: "＋", classes: "bg-green-50 text-statut-online", libelle: "Recharge" },
};

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function jourLisible(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function FilChronologique({
  evenements,
}: {
  evenements: EvenementFil[];
}) {
  if (evenements.length === 0) {
    return (
      <p className="text-sm text-mention">
        Rien à relire pour l&apos;instant — son histoire commence.
      </p>
    );
  }

  // Regroupement par jour, du plus récent au plus ancien
  const parJour = new Map<string, EvenementFil[]>();
  for (const e of [...evenements].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    const cle = e.date.slice(0, 10);
    if (!parJour.has(cle)) parJour.set(cle, []);
    parJour.get(cle)!.push(e);
  }

  return (
    <div className="space-y-6">
      {[...parJour.entries()].map(([jour, liste]) => (
        <section key={jour}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mention">
            {jourLisible(jour)}
          </p>

          {/* Un filet vertical relie les événements du jour */}
          <ul className="relative space-y-3 border-l border-greige/60 pl-5">
            {liste.map((e, i) => {
              const m = MARQUEURS[e.type];
              return (
                <li key={i} className="relative">
                  <span
                    aria-label={m.libelle}
                    className={`absolute -left-[2.05rem] flex h-7 w-7 items-center justify-center rounded-full text-sm ${m.classes}`}
                  >
                    {m.icone}
                  </span>

                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`whitespace-pre-wrap text-sm ${
                          e.statut && e.statut !== "attente"
                            ? "text-mention"
                            : "text-ink"
                        }`}
                      >
                        {e.titre}
                      </p>
                      {(e.detail || e.statut) && (
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-mention">
                          {e.detail && <span>{e.detail}</span>}
                          {e.type === "augure" && e.statut && (
                            <span
                              className={`rounded-full px-2 py-0.5 font-medium ${
                                e.statut === "confirme"
                                  ? "bg-green-50 text-statut-online"
                                  : e.statut === "pas_encore"
                                  ? "bg-greige/50 text-mention"
                                  : "bg-gold/20 text-gold-dark"
                              }`}
                            >
                              {e.statut === "confirme"
                                ? "✓ advenu"
                                : e.statut === "pas_encore"
                                ? "pas encore"
                                : "en attente"}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-right">
                      {e.nonFacturee ? (
                        <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs text-mention">
                          Non facturé
                        </span>
                      ) : e.montant != null && e.montant > 0 ? (
                        <span
                          className={`font-bold tabular-nums ${
                            e.type === "recharge"
                              ? "text-statut-online"
                              : "text-aubergine"
                          }`}
                        >
                          {e.type === "recharge" ? "+" : ""}
                          {euros(e.montant)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export { formatDateNaissance };
