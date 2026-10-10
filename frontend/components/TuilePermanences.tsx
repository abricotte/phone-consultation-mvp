"use client";

import { heureFr, dansCombien, type ElenaPresence, type ElenaStatus } from "@/components/useElenaStatus";

// PROCHAINES PERMANENCES D'ELENA — la tuile C de l'accueil. Elle répond
// à « Quand revient-elle ? »
//
// Elle voit les deux ou trois prochains moments où Elena sera en ligne,
// et la sortie vers le rendez-vous. Trois créneaux maximum, les
// prochains seulement : au-delà, la tuile redeviendrait un calendrier,
// et un calendrier appellerait un onglet.
//
// La rareté travaille pour le rendez-vous : trois fenêtres dans la
// semaine, c'est la réalité d'un cabinet — c'est ce qui rend « aucun de
// ces moments ne vous convient ? » naturel plutôt que commercial. Et en
// semaine vide, la tuile inverse la proposition : le rendez-vous devient
// l'unique porte, présentée positivement.
//
// Zéro donnée nouvelle : elle lit les créneaux que le statut public livre
// déjà. Quand Elena pose ses créneaux le dimanche soir, toutes ses
// clientes les voient lundi matin.

const CALENDLY = "https://elena-wolska.com/disponibilites";

type Creneau = { debut: string; fin: string };

interface Props {
  presence: ElenaPresence;
  statutDemo?: ElenaStatus;
  prochainesDemo?: Creneau[];
}

const PARIS = { timeZone: "Europe/Paris" } as const;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Les créneaux à montrer : ceux d'AUJOURD'HUI sont déjà dans la carte d'Elena */
function suivantes(prochaines: Creneau[]): Creneau[] {
  const aujourdhui = new Date().toLocaleDateString("sv-SE", PARIS);
  return prochaines.filter(
    (c) => new Date(c.debut).toLocaleDateString("sv-SE", PARIS) !== aujourdhui
  );
}

/**
 * La tuile a-t-elle quelque chose à dire ? L'accueil s'en sert pour
 * recomposer la grille — pas de trou à la place d'une tuile absente.
 * Masquée si Elena est en ligne (le bouton d'appel suffit), pendant le
 * chargement, ou si elle n'utilise pas les permanences du tout — ses
 * heures habituelles en texte libre font alors le travail.
 */
export function permanencesVisibles(
  presence: ElenaPresence,
  statutDemo?: ElenaStatus,
  prochainesDemo?: Creneau[]
): boolean {
  const statut = statutDemo ?? presence.statut;
  if (statut === "disponible" || statut === "chargement") return false;
  if (!prochainesDemo && !presence.permanence.actives) return false;
  const prochaines = prochainesDemo ?? presence.permanence.prochaines;
  if (prochaines.length === 0) return true; // variante « semaine sans permanence »
  return suivantes(prochaines).length > 0;
}

export default function TuilePermanences({ presence, statutDemo, prochainesDemo }: Props) {
  if (!permanencesVisibles(presence, statutDemo, prochainesDemo)) return null;
  const prochaines = prochainesDemo ?? presence.permanence.prochaines;

  // ── Semaine sans permanence : le rendez-vous, présenté positivement ──
  if (prochaines.length === 0) {
    return (
      <section className="flex h-full flex-col rounded-3xl border border-gold/40 bg-gradient-to-r from-gold/10 to-ivory p-5 shadow-soft md:p-7">
        <h2 className="flex items-center gap-2.5 font-serif text-2xl font-semibold text-aubergine">
          <span aria-hidden className="text-sm text-gold">✦</span>
          Cette semaine, Elena reçoit uniquement sur rendez-vous
        </h2>
        <p className="mt-2 text-sm text-ink/80">
          Choisissez le moment qui vous convient — Découverte 20 min ou
          Complète 45 min, confirmé immédiatement.
        </p>
        <a
          href={CALENDLY}
          className="mt-4 inline-block self-start rounded-2xl bg-aubergine px-6 py-3 text-sm font-semibold text-cream transition hover:bg-aubergine/90"
        >
          Voir les créneaux disponibles
        </a>
      </section>
    );
  }

  const liste = suivantes(prochaines).slice(0, 3);

  // ── Permanences posées ──
  return (
    <section className="flex h-full flex-col rounded-3xl border border-greige bg-ivory p-5 md:p-7">
      <h2 className="font-serif text-2xl font-semibold text-aubergine">
        Prochaines permanences d&apos;Elena
      </h2>
      <p className="mt-0.5 text-xs text-mention">
        joignable à la minute pendant ces créneaux
      </p>

      <ul className="mt-4 space-y-2">
        {liste.map((c, i) => {
          const d = new Date(c.debut);
          const jourAbr = majuscule(d.toLocaleDateString("fr-FR", { weekday: "short", ...PARIS }));
          const jourLong = majuscule(d.toLocaleDateString("fr-FR", { weekday: "long", ...PARIS }));
          const dateCourte = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", ...PARIS });
          return (
            <li
              key={c.debut}
              className="flex items-center justify-between gap-3 rounded-2xl bg-blush px-3.5 py-3"
            >
              {/* Téléphone : « Jeudi 9 oct. » / « 17h45 – 19h00 » */}
              <span className="text-sm font-semibold text-aubergine md:hidden">
                {jourLong} {dateCourte}
              </span>
              {/* Bureau : bloc date à gauche, heures, puis « dans 2 j » */}
              <span className="hidden w-14 shrink-0 flex-col md:flex">
                <span className="font-serif text-[22px] font-bold leading-none text-aubergine">
                  {jourAbr}
                </span>
                <span className="mt-0.5 text-[13px] text-mention">{dateCourte}</span>
              </span>
              <span className="text-[15px] font-semibold tabular-nums text-aubergine md:flex-1">
                {heureFr(c.debut, true)} – {heureFr(c.fin, true)}
              </span>
              {i === 0 && (
                <span className="hidden text-xs font-semibold text-gold-dark md:inline">
                  {dansCombien(c.debut)}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Le pont vers le rendez-vous — la ligne qui fait le travail
          d'incitation, sans forcer : si aucun moment ne convient, le
          calendrier est juste là. */}
      <p className="mt-auto pt-4 text-sm text-ink/80">
        <span className="block border-t border-dashed border-greige pt-3">
          Aucun de ces moments ne vous convient ?{" "}
          <a href={CALENDLY} className="font-bold text-prix underline underline-offset-2">
            Réservez votre créneau au calendrier →
          </a>
        </span>
      </p>
    </section>
  );
}
