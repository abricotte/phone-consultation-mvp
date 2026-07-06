"use client";

import { useElenaStatus } from "@/components/useElenaStatus";

function StatusBadge({ online }: { online: boolean | null }) {
  if (online === null) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-greige/70 bg-ivory px-3 py-1 text-xs font-medium text-ink/50">
        <span className="h-2 w-2 rounded-full bg-greige" />
        Vérification…
      </span>
    );
  }
  return online ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      Elena est en ligne
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/60">
      <span className="h-2 w-2 rounded-full bg-ink/30" />
      Elena n&apos;est pas en ligne actuellement
    </span>
  );
}

function Puce({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden className="mt-0.5 text-coral">
        ✦
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function Formules() {
  const status = useElenaStatus();
  const online = status === "loading" ? null : status === "online";

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* ===== 1. Consultation Immédiate (à la minute) ===== */}
      <div className="relative flex flex-col rounded-2xl border border-greige/70 bg-ivory/60 p-7 transition hover:border-coral/50 hover:shadow-soft">
        <div className="mb-3">
          <StatusBadge online={online} />
        </div>
        <p className="text-sm font-medium uppercase tracking-wider text-gold-dark">
          Pour un besoin qui ne peut pas attendre
        </p>
        <h3 className="mt-1 font-serif text-2xl font-semibold text-aubergine">
          Consultation Immédiate
        </h3>
        <p className="mt-1 text-sm text-ink/60">À la minute, par téléphone</p>
        <p className="mt-3 min-h-[5rem] text-sm text-ink/70">
          {online === false
            ? "Rechargez dès maintenant : vous serez prête à appeler dès qu'Elena se connecte. En attendant, vous pouvez réserver un créneau."
            : "Une inquiétude, un message reçu, une décision à prendre ce soir ? Quand Elena est en ligne, elle vous appelle dans les minutes qui suivent. Pas de rendez-vous, pas d'attente."}
        </p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-serif text-5xl font-semibold text-coral">
            2,90
          </span>
          <span className="text-lg font-medium text-ink/70">€ / min</span>
        </div>

        <div className="rule-gold my-6" />

        <div className="mb-6 rounded-xl border border-greige/60 bg-blush/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-aubergine/70">
            Cette consultation vous apporte :
          </p>
          <ul className="space-y-2.5 text-sm text-ink/80">
            {online === false ? (
              <Puce>Revenez quand Elena est en ligne — ou réservez un créneau</Puce>
            ) : (
              <Puce>Une réponse maintenant, au moment où vous en avez besoin</Puce>
            )}
            <Puce>
              La liberté de parler 5 minutes ou 30 — c&apos;est vous qui décidez
            </Puce>
            <Puce>
              Vous gardez la main : le crédit non utilisé reste acquis pour la
              prochaine fois
            </Puce>
          </ul>
        </div>

        <a
          href="/consultation-minute"
          className={`mt-auto block rounded-full px-6 py-3 text-center font-medium transition ${
            online
              ? "bg-coral text-white shadow-card hover:bg-coral-dark"
              : "border border-coral text-coral hover:bg-coral hover:text-white"
          }`}
        >
          {online ? "J'appelle Elena maintenant" : "Recharger mon crédit"}
        </a>
        {online === false && (
          <a
            href="https://elena-wolska.com/disponibilites"
            className="mt-3 text-center text-sm font-medium text-coral hover:underline"
          >
            Voir les disponibilités →
          </a>
        )}
        {/* TODO Phase 6 : bouton "Prévenez-moi quand Elena se connecte" (état hors ligne) */}
        <p className="mt-4 text-center text-xs leading-relaxed text-ink/55">
          Crédit minimum 5 min (14,50 €) — vous ne dépassez jamais votre
          budget.
        </p>
      </div>

      {/* ===== 2. Consultation Découverte (20 min) ===== */}
      <div className="relative flex flex-col rounded-2xl border border-greige/70 bg-ivory/60 p-7 transition hover:border-coral/50 hover:shadow-soft">
        <div className="mb-3 h-6" aria-hidden />
        <p className="text-sm font-medium uppercase tracking-wider text-gold-dark">
          Pour une question précise
        </p>
        <h3 className="mt-1 font-serif text-2xl font-semibold text-aubergine">
          Consultation Découverte
        </h3>
        <p className="mt-1 text-sm text-ink/60">20 minutes par téléphone</p>
        <p className="mt-3 min-h-[5rem] text-sm text-ink/70">
          Idéale si vous avez une question claire et que vous cherchez une
          réponse précise pour avancer.
        </p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-serif text-5xl font-semibold text-coral">
            58
          </span>
          <span className="text-lg font-medium text-ink/70">€</span>
        </div>

        <div className="rule-gold my-6" />

        <div className="mb-6 rounded-xl border border-greige/60 bg-blush/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-aubergine/70">
            Cette consultation vous apporte :
          </p>
          <ul className="space-y-2.5 text-sm text-ink/80">
            <Puce>Une réponse claire à votre question</Puce>
            <Puce>Un éclairage sur votre situation</Puce>
            <Puce>Une direction pour la suite</Puce>
          </ul>
        </div>

        {/* TODO Phase 3 : brancher sur le tunnel Stripe forfait 20 min */}
        <a
          href="/consultants?formule=decouverte"
          className="mt-auto block rounded-full border border-coral px-6 py-3 text-center font-medium text-coral transition hover:bg-coral hover:text-white"
        >
          Je prends rendez-vous
        </a>
      </div>

      {/* ===== 3. Consultation Complète (45 min) ===== */}
      <div className="relative flex flex-col rounded-2xl border border-coral bg-ivory p-7 shadow-card">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-coral px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-card">
          Recommandée
        </span>
        <div className="mb-3 h-6" aria-hidden />
        <p className="text-sm font-medium uppercase tracking-wider text-gold-dark">
          Pour un bilan complet
        </p>
        <h3 className="mt-1 font-serif text-2xl font-semibold text-aubergine">
          Consultation Complète
        </h3>
        <p className="mt-1 text-sm text-ink/60">45 minutes par téléphone</p>
        <p className="mt-3 min-h-[5rem] text-sm text-ink/70">
          Pour prendre le temps de faire vraiment le point sur votre vie, vos
          questions, vos choix à venir.
        </p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-serif text-5xl font-semibold text-coral">
            129
          </span>
          <span className="text-lg font-medium text-ink/70">€</span>
        </div>

        <div className="rule-gold my-6" />

        <div className="mb-6 rounded-xl border border-greige/60 bg-blush/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-aubergine/70">
            Cette consultation vous apporte :
          </p>
          <ul className="space-y-2.5 text-sm text-ink/80">
            <Puce>Une vision d&apos;ensemble de votre situation</Puce>
            <Puce>Un éclairage sur amour, professionnel, relations</Puce>
            <Puce>Des pistes claires pour avancer</Puce>
          </ul>
        </div>

        {/* TODO Phase 3 : brancher sur le tunnel Stripe forfait 45 min */}
        <a
          href="/consultants?formule=complete"
          className="mt-auto block rounded-full bg-coral px-6 py-3 text-center font-medium text-white shadow-card transition hover:bg-coral-dark"
        >
          Je prends rendez-vous
        </a>
      </div>
    </div>
  );
}
