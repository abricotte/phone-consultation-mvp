import { Icone } from "@/components/IconesEspace";
import { heureFr } from "@/components/useElenaStatus";

// PROCHAIN RENDEZ-VOUS — la tuile en haut à droite de l'accueil (maquette
// v2, validée le 11 octobre). Une cliente qui a réservé sur Calendly ne
// voyait rien de ce rendez-vous dans son espace : il est pourtant là,
// rattaché à sa fiche par le webhook. C'est lui qui compte aujourd'hui —
// avant le crédit, avant la recharge.
//
// « Déjà réglée » évite qu'elle pense devoir recharger pour être appelée.

export interface ProchainRendezVous {
  id: string;
  debut: string;
  fin: string;
  formule: string | null;
  minutes: number | null;
  regle: boolean;
  rescheduleUrl: string | null;
  cancelUrl: string | null;
}

const CALENDLY = "https://elena-wolska.com/disponibilites";

/** « Jeudi 15 octobre » */
function jourLong(iso: string): string {
  const d = new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export default function TuileRendezVous({ prochain }: { prochain: ProchainRendezVous | null }) {
  if (!prochain) {
    return (
      <section className="flex h-full flex-col rounded-3xl border border-greige bg-ivory p-5 md:p-7">
        <h2 className="font-serif text-2xl font-semibold text-aubergine">Prochain rendez-vous</h2>
        <p className="mt-3 text-[13px] italic text-mention">Aucun rendez-vous prévu.</p>
        <a
          href={CALENDLY}
          className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 pt-3 text-sm font-semibold text-prix hover:underline"
        >
          <Icone nom="reserver" taille={16} />
          Voir les prochaines disponibilités
        </a>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 to-ivory p-5 shadow-soft md:p-7">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-serif text-2xl font-semibold text-aubergine">Prochain rendez-vous</h2>
        <span className="shrink-0 rounded-full bg-statut-online/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-statut-online">
          Confirmé
        </span>
      </div>
      <p className="mt-3 text-lg font-bold text-aubergine">
        {jourLong(prochain.debut)} · {heureFr(prochain.debut)}
      </p>
      {(prochain.formule || prochain.minutes) && (
        <p className="text-[13px] text-ink">
          {prochain.formule ?? "Consultation"}
          {prochain.minutes ? ` · ${prochain.minutes} minutes` : ""}
        </p>
      )}
      <p className="mt-2 text-[13px] text-mention">
        {prochain.regle ? "Déjà réglée · " : ""}Elena vous appellera au numéro de votre compte.
      </p>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4">
        <a
          href="/profil#aborder"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-prix hover:underline"
        >
          <Icone nom="modifier" taille={16} />
          Préparer mes questions
        </a>
        {prochain.rescheduleUrl && (
          <a
            href={prochain.rescheduleUrl}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-mention hover:text-aubergine"
          >
            <Icone nom="reserver" taille={16} />
            Déplacer ou annuler
          </a>
        )}
      </div>
    </section>
  );
}
