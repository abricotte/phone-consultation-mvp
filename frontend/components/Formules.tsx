"use client";

import { useElenaStatus, type ElenaStatus } from "@/components/useElenaStatus";

function LigneStatut({ statut }: { statut: ElenaStatus }) {
  if (statut === "chargement") {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium text-mention-light">
        <span className="h-2 w-2 rounded-full bg-greige" />
        Vérification…
      </span>
    );
  }
  if (statut === "disponible") {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-statut-online">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-statut-online" />
        </span>
        En ligne
      </span>
    );
  }
  if (statut === "en_consultation") {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        En consultation
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-mention">
      <span className="h-2 w-2 rounded-full bg-statut-offline" />
      Hors ligne
    </span>
  );
}

export default function Formules() {
  const statut = useElenaStatus();
  const enLigne = statut === "disponible";

  // Une seule phrase par état (carte Immédiate)
  const phraseImmediate =
    statut === "en_consultation"
      ? "Elena est en consultation. Rechargez pour être prête quand elle se libère."
      : statut === "hors_ligne"
      ? "Rechargez dès maintenant : vous serez prête dès qu'Elena se connecte."
      : "Elena vous appelle dans la minute. Vous parlez le temps que vous voulez.";

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* ===== 1. Immédiate ===== */}
      <div className="flex flex-col rounded-2xl border border-greige/70 bg-ivory/60 p-7 transition hover:shadow-soft">
        <div className="mb-2">
          <LigneStatut statut={statut} />
        </div>
        <h3 className="font-serif text-3xl font-semibold text-aubergine">
          Immédiate
        </h3>
        <p className="mt-1 text-sm text-ink">
          Sans rendez-vous, quand Elena est en ligne
        </p>

        <p className="mt-5 font-serif text-[30px] font-semibold leading-none text-prix">
          2,90&nbsp;€<span className="text-lg font-medium"> / min</span>
        </p>

        <p className="mt-4 min-h-[3rem] text-sm leading-relaxed text-ink">
          {phraseImmediate}
        </p>

        <a
          href="/consultation-minute"
          className={`mt-6 block rounded-full px-6 py-3 text-center font-medium transition ${
            enLigne
              ? "bg-cta text-cta-text shadow-card hover:bg-cta-dark"
              : "border border-cta-outline text-prix hover:bg-cta hover:text-cta-text hover:border-cta"
          }`}
        >
          {enLigne ? "J'appelle Elena maintenant" : "Recharger mon crédit"}
        </a>
        {statut === "hors_ligne" && (
          <a
            href="https://elena-wolska.com/disponibilites"
            className="mt-3 text-center text-sm font-medium text-prix hover:underline"
          >
            Voir les disponibilités →
          </a>
        )}
        <p className="mt-3 text-center text-xs text-mention">
          Minimum 5 min (14,50 €)
        </p>
      </div>

      {/* ===== 2. Découverte ===== */}
      <div className="flex flex-col rounded-2xl border border-greige/70 bg-ivory/60 p-7 transition hover:shadow-soft">
        <div className="mb-2 h-4" aria-hidden />
        <h3 className="font-serif text-3xl font-semibold text-aubergine">
          Découverte
        </h3>
        <p className="mt-1 text-sm text-ink">20 minutes, sur rendez-vous</p>

        <p className="mt-5 font-serif text-[30px] font-semibold leading-none text-prix">
          58&nbsp;€
        </p>

        <p className="mt-4 min-h-[3rem] text-sm leading-relaxed text-ink">
          Une question précise, une réponse claire pour avancer.
        </p>

        {/* TODO Phase 3 : lien réservation (Calendly conservé) */}
        <a
          href="https://elena-wolska.com/disponibilites"
          className="mt-6 block rounded-full border border-cta-outline px-6 py-3 text-center font-medium text-prix transition hover:border-cta hover:bg-cta hover:text-cta-text"
        >
          Je prends rendez-vous
        </a>
      </div>

      {/* ===== 3. Complète (Recommandée) ===== */}
      <div className="relative flex flex-col rounded-2xl border-[1.5px] border-recommended bg-blush p-7 shadow-card">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cta px-4 py-1 text-xs font-semibold uppercase tracking-wide text-cta-text">
          Recommandée
        </span>
        <div className="mb-2 h-4" aria-hidden />
        <h3 className="font-serif text-3xl font-semibold text-aubergine">
          Complète
        </h3>
        <p className="mt-1 text-sm text-ink">45 minutes, sur rendez-vous</p>

        <p className="mt-5 font-serif text-[30px] font-semibold leading-none text-prix">
          129&nbsp;€
        </p>

        <p className="mt-4 min-h-[3rem] text-sm leading-relaxed text-ink">
          Le temps de faire vraiment le point, en profondeur.
        </p>

        {/* TODO Phase 3 : lien réservation (Calendly conservé) */}
        <a
          href="https://elena-wolska.com/disponibilites"
          className="mt-6 block rounded-full bg-cta px-6 py-3 text-center font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
        >
          Je prends rendez-vous
        </a>
      </div>
    </div>
  );
}
