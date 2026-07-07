"use client";

import { useElenaStatus } from "@/components/useElenaStatus";
import RechargeSelector from "@/components/RechargeSelector";

export default function ConsultationMinutePage() {
  const statut = useElenaStatus();
  const enLigne = statut === "disponible";

  return (
    <div>
      {/* ===== En-tête ===== */}
      <section className="bg-warm">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <div className="mb-5 flex justify-center">
            {statut === "chargement" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-greige/70 bg-ivory px-4 py-1.5 text-sm font-medium text-ink/50">
                <span className="h-2.5 w-2.5 rounded-full bg-greige" />
                Vérification de la disponibilité…
              </span>
            )}
            {statut === "disponible" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                </span>
                Elena est en ligne
              </span>
            )}
            {statut === "en_consultation" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Elena est en consultation
              </span>
            )}
            {statut === "hors_ligne" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-sm font-medium text-ink/60">
                <span className="h-2.5 w-2.5 rounded-full bg-ink/30" />
                Elena n&apos;est pas en ligne actuellement
              </span>
            )}
          </div>

          <h1 className="font-serif text-5xl font-semibold text-aubergine">
            Consultation Immédiate
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink/80">
            Sans rendez-vous, au rythme de votre besoin :{" "}
            <strong className="text-prix">2,90 € / minute</strong>. Vous
            parlez le temps que vous voulez — et vous ne dépassez jamais votre
            budget.
          </p>

          {/* Ce que la formule vous apporte (contenu migré des cartes) */}
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-ink">
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-0.5 text-coral">✦</span>
              <span>Une réponse maintenant, au moment où vous en avez besoin</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-0.5 text-coral">✦</span>
              <span>La liberté de parler 5 minutes ou 30 — c&apos;est vous qui décidez</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-0.5 text-coral">✦</span>
              <span>Le crédit non utilisé reste acquis pour la prochaine fois</span>
            </li>
          </ul>

          {statut === "en_consultation" && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <p className="text-sm text-ink/80">
                Elena est en pleine consultation. Rechargez votre crédit pour
                être prête quand elle se libère.
              </p>
            </div>
          )}
          {statut === "hors_ligne" && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-greige/70 bg-ivory p-5">
              <p className="text-sm text-ink/80">
                Elena n&apos;est pas en ligne — vous pouvez recharger votre
                crédit pour être prête à son retour, ou réserver un créneau.
              </p>
              <a
                href="https://elena-wolska.com/disponibilites"
                className="mt-3 inline-block text-sm font-medium text-cta hover:underline"
              >
                Voir les disponibilités →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ===== 3 étapes ===== */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="mb-10 text-center font-serif text-3xl font-semibold text-aubergine">
          Comment ça marche ?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Créez votre compte",
              d: "En quelques secondes, avec votre numéro de téléphone.",
            },
            {
              n: "2",
              t: "Rechargez votre crédit",
              d: "Par carte, en toute sécurité. Votre crédit n'expire jamais.",
            },
            {
              n: "3",
              t: "Appelez quand Elena est en ligne",
              d: "Un clic, et votre téléphone sonne. Un signal discret vous préviendra 2 minutes avant la fin.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-greige/60 bg-ivory p-7 text-center"
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-coral/10 font-serif text-xl font-semibold text-prix">
                {s.n}
              </div>
              <h3 className="font-serif text-lg font-semibold text-aubergine">
                {s.t}
              </h3>
              <p className="mt-2 text-sm text-ink/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Recharge ===== */}
      <section className="bg-warm">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="mb-8 text-center font-serif text-3xl font-semibold text-aubergine">
            Rechargez votre crédit
          </h2>
          <RechargeSelector />
        </div>
      </section>

      {/* ===== Cadre de l'appel ===== */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="font-serif text-3xl font-semibold text-aubergine">
          Un cadre clair, sans surprise
        </h2>
        <ul className="mx-auto mt-8 max-w-xl space-y-4 text-left text-sm text-ink">
          <li className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-coral">✦</span>
            <span>
              <strong className="text-aubergine">
                C&apos;est le +33&nbsp;1&nbsp;62&nbsp;29&nbsp;07&nbsp;99 qui
                vous appellera
              </strong>{" "}
              — enregistrez-le pour décrocher en confiance.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-coral">✦</span>
            <span>
              Un signal discret vous prévient{" "}
              <strong className="text-aubergine">
                2 minutes avant la fin de votre crédit
              </strong>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-coral">✦</span>
            <span>
              À crédit épuisé, l&apos;appel se termine automatiquement :{" "}
              <strong className="text-aubergine">
                vous ne dépassez jamais votre budget
              </strong>
              .
            </span>
          </li>
        </ul>

        <a
          href={enLigne ? "/consultants" : "/dashboard"}
          className="mt-10 inline-block rounded-full bg-cta px-8 py-3.5 font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
        >
          {enLigne ? "J'appelle Elena maintenant" : "Recharger mon crédit"}
        </a>
      </section>
    </div>
  );
}
