"use client";

import {
  useElenaPresence,
  libelleCourtPermanence,
  dansCombien,
  type ElenaStatus,
} from "@/components/useElenaStatus";

// PROCHAINES PERMANENCES — sous la carte d'action de l'accueil cliente.
//
// Elle voit les deux ou trois prochains moments où Elena sera en ligne,
// et la sortie vers le rendez-vous. Trois créneaux maximum, les
// prochains seulement : au-delà, l'encadré redeviendrait un calendrier,
// et un calendrier appellerait un onglet.
//
// La rareté travaille pour le rendez-vous : trois fenêtres dans la
// semaine, c'est la réalité d'un cabinet — c'est ce qui rend « aucun de
// ces moments ne vous convient ? » naturel plutôt que commercial. Et en
// semaine vide, l'encadré inverse la proposition : le rendez-vous devient
// l'unique porte, présentée positivement.
//
// Zéro donnée nouvelle : il lit les créneaux que le statut public livre
// déjà. Quand Elena pose ses créneaux le dimanche soir, toutes ses
// clientes les voient lundi matin.

const CALENDLY = "https://elena-wolska.com/disponibilites";

export default function EncadrePermanences({
  statutDemo,
  prochainesDemo,
}: {
  statutDemo?: ElenaStatus;
  prochainesDemo?: { debut: string; fin: string }[];
} = {}) {
  const presence = useElenaPresence();
  const statut = statutDemo ?? presence.statut;
  const prochaines = prochainesDemo ?? presence.permanence.prochaines;

  // Pas d'encadré si Elena est en ligne (le bouton d'appel suffit), ni
  // pendant le chargement, ni si elle n'utilise pas les permanences du
  // tout — ses heures habituelles en texte libre font alors le travail.
  if (statut === "disponible" || statut === "chargement") return null;
  if (!prochainesDemo && !presence.permanence.actives) return null;

  // Le créneau AUJOURD'HUI est déjà en grand dans la bannière : l'encadré
  // montre les suivants. Sinon deux fois la même heure sur un écran.
  const aujourdhui = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  const suivantes = prochaines.filter(
    (c) => new Date(c.debut).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }) !== aujourdhui
  );

  // ── Semaine sans permanence : le rendez-vous, présenté positivement ──
  if (prochaines.length === 0) {
    return (
      <section className="mt-4 rounded-3xl border border-gold/40 bg-gradient-to-r from-gold/10 to-ivory p-6 shadow-soft">
        <p className="flex items-center gap-2.5 font-serif text-lg font-semibold text-aubergine">
          <span aria-hidden className="text-sm text-gold">✦</span>
          Cette semaine, Elena reçoit uniquement sur rendez-vous
        </p>
        <p className="mt-2 text-sm text-ink/80">
          Choisissez le moment qui vous convient — Découverte 20 min ou
          Complète 45 min, confirmé immédiatement.
        </p>
        <a
          href={CALENDLY}
          className="mt-4 inline-block rounded-2xl bg-aubergine px-6 py-3 text-sm font-semibold text-cream transition hover:bg-aubergine/90"
        >
          Voir les créneaux disponibles
        </a>
      </section>
    );
  }

  // Tout est aujourd'hui (déjà dans la bannière) → rien à ajouter
  if (suivantes.length === 0) return null;

  // ── Permanences posées ──
  return (
    <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
      <p className="flex items-center gap-2.5 font-serif text-lg font-semibold text-aubergine">
        <span aria-hidden className="text-sm text-gold">✦</span>
        Prochaines permanences d&apos;Elena
      </p>
      <p className="mt-1 text-xs text-mention">
        En ligne et joignable à la minute pendant ces créneaux — la prochaine
        commence{" "}
        <span className="font-bold text-gold-dark">{dansCombien(prochaines[0].debut)}</span>.
      </p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {suivantes.map((c) => (
          <li
            key={c.debut}
            className="rounded-full border border-greige/60 bg-blush/50 px-4 py-1.5 text-sm font-semibold tabular-nums text-aubergine"
          >
            {libelleCourtPermanence(c)}
          </li>
        ))}
      </ul>

      {/* Le pont vers le rendez-vous — la ligne qui fait le travail
          d'incitation, sans forcer : si aucun moment ne convient, le
          calendrier est juste là. */}
      <p className="mt-4 border-t border-dashed border-greige/60 pt-3 text-sm text-ink/80">
        Aucun de ces moments ne vous convient ?{" "}
        <a href={CALENDLY} className="font-bold text-prix underline underline-offset-2">
          Réservez votre créneau au calendrier →
        </a>
      </p>
    </section>
  );
}
