"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useElenaStatus } from "@/components/useElenaStatus";
import RechargeSelector from "@/components/RechargeSelector";

export default function ConsultationMinutePage() {
  const statut = useElenaStatus();
  const enLigne = statut === "disponible";

  const [appelEnCours, setAppelEnCours] = useState(false);
  const [messageAppel, setMessageAppel] = useState("");
  const [erreurAppel, setErreurAppel] = useState("");

  // Parcours d'appel UNIQUE de la cliente : session + appel Twilio
  async function handleAppel() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setAppelEnCours(true);
    setMessageAppel("");
    setErreurAppel("");
    try {
      const session = await api.createSession();
      setMessageAppel("Session créée, lancement de l'appel…");
      const call = await api.initiateCall(session.id);
      setMessageAppel(
        `📞 C'est parti ! Votre téléphone va sonner${
          call.maxMinutes ? ` — jusqu'à ${call.maxMinutes} min avec votre crédit` : ""
        }.`
      );
    } catch (err) {
      setErreurAppel(
        err instanceof Error ? err.message : "Erreur lors de l'appel"
      );
    } finally {
      setAppelEnCours(false);
    }
  }

  return (
    <div>
      {/* ===== En-tête ===== */}
      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <div className="mb-5 flex justify-center">
            {statut === "chargement" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-greige/70 bg-ivory px-4 py-1.5 text-sm font-medium text-mention">
                <span className="h-2.5 w-2.5 rounded-full bg-greige" />
                Vérification de la disponibilité…
              </span>
            )}
            {statut === "disponible" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-statut-online">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-statut-online" />
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
              <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-sm font-medium text-mention">
                <span className="h-2.5 w-2.5 rounded-full bg-statut-offline" />
                Elena n&apos;est pas en ligne actuellement
              </span>
            )}
          </div>

          <h1 className="font-serif text-[44px] font-semibold leading-[1.15] text-aubergine md:text-[48px]">
            Consultation Immédiate
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink">
            Sans rendez-vous. <strong className="text-prix">2,90 € la minute</strong>.
            Vous parlez le temps que vous voulez.
          </p>

          {/* Ce que la formule vous apporte (contenu migré des cartes) */}
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-ink">
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-0.5 text-aubergine/40">✦</span>
              <span>Une réponse tout de suite</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-0.5 text-aubergine/40">✦</span>
              <span>Vous arrêtez quand vous voulez</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-0.5 text-aubergine/40">✦</span>
              <span>Le crédit non utilisé est gardé pour la prochaine fois</span>
            </li>
          </ul>

          {/* ===== Action principale (au décroché du hero, pas en bas de page) ===== */}
          {statut === "disponible" && (
            <div className="mt-8">
              <button
                onClick={handleAppel}
                disabled={appelEnCours}
                className="rounded-full bg-cta px-8 py-4 text-lg font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
              >
                {appelEnCours
                  ? "Connexion en cours…"
                  : "J'appelle Elena maintenant"}
              </button>
              <p className="mt-3 text-xs text-mention">
                Crédit minimum 5 min (14,50 €) — vous ne dépassez jamais votre
                budget.
              </p>
            </div>
          )}

          {statut === "en_consultation" && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <p className="text-sm leading-relaxed text-ink">
                Elena est en pleine consultation. Rechargez votre crédit pour
                être prête quand elle se libère.
              </p>
              <a
                href="#recharge"
                className="mt-3 inline-block text-sm font-medium text-prix hover:underline"
              >
                Recharger mon crédit ↓
              </a>
            </div>
          )}
          {statut === "hors_ligne" && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-greige/70 bg-ivory p-5">
              <p className="text-sm leading-relaxed text-ink">
                Elena n&apos;est pas en ligne. Vous pouvez recharger dès
                maintenant pour être prête à son retour, ou réserver un
                créneau.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-4">
                <a
                  href="#recharge"
                  className="text-sm font-medium text-prix hover:underline"
                >
                  Recharger mon crédit ↓
                </a>
                <a
                  href="https://elena-wolska.com/disponibilites"
                  className="text-sm font-medium text-prix hover:underline"
                >
                  Voir les disponibilités →
                </a>
              </div>
            </div>
          )}

          {/* Retour d'état de l'appel — juste sous le bouton, là où on clique */}
          {messageAppel && (
            <p className="mx-auto mt-6 max-w-md rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {messageAppel}
            </p>
          )}
          {erreurAppel && (
            <p className="mx-auto mt-6 max-w-md rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {erreurAppel}
            </p>
          )}
        </div>
      </section>

      {/* ===== 3 étapes ===== */}
      <section className="bg-blush">
        <div className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="mb-12 text-center font-serif text-3xl font-semibold text-aubergine">
          Comment ça marche ?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Créez votre compte",
              d: [
                "En quelques instants, avec votre adresse email et votre numéro de téléphone. C'est ce numéro qu'Elena appellera pour votre consultation.",
              ],
            },
            {
              n: "2",
              t: "Rechargez votre crédit",
              d: [
                "Paiement sécurisé par Stripe, la solution utilisée par les plus grands sites. Vos coordonnées bancaires sont traitées directement par Stripe — elles ne passent jamais par notre site et n'y sont jamais conservées.",
                "Vous recevez un reçu par email après chaque paiement. Votre crédit n'expire jamais et reste disponible pour toutes vos prochaines consultations.",
              ],
            },
            {
              n: "3",
              t: "Appelez quand Elena est en ligne",
              d: [
                "Un clic, et votre téléphone sonne. Vous êtes mise en relation avec Elena en quelques secondes. Un signal discret vous prévient 2 minutes avant la fin, et vous ne dépassez jamais votre budget.",
              ],
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-greige/60 bg-ivory p-7 text-center"
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-cta/10 font-serif text-xl font-semibold text-prix">
                {s.n}
              </div>
              <h3 className="font-serif text-lg font-semibold text-aubergine">
                {s.t}
              </h3>
              {s.d.map((paragraphe, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-ink">
                  {paragraphe}
                </p>
              ))}
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ===== Recharge ===== */}
      <section id="recharge" className="bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="mb-10 text-center font-serif text-3xl font-semibold text-aubergine">
            Rechargez votre crédit
          </h2>
          <RechargeSelector />
        </div>
      </section>

      {/* ===== Cadre de l'appel ===== */}
      <section className="bg-blush">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="font-serif text-3xl font-semibold text-aubergine">
          Un cadre clair, sans surprise
        </h2>
        <ul className="mx-auto mt-8 max-w-xl space-y-4 text-left text-sm text-ink">
          <li className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-aubergine/40">✦</span>
            <span>
              <strong className="text-aubergine">
                C&apos;est le +33&nbsp;1&nbsp;62&nbsp;29&nbsp;07&nbsp;99 qui
                vous appellera
              </strong>{" "}
              — enregistrez-le pour décrocher en confiance.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-aubergine/40">✦</span>
            <span>
              Un signal discret vous prévient{" "}
              <strong className="text-aubergine">
                2 minutes avant la fin de votre crédit
              </strong>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-aubergine/40">✦</span>
            <span>
              À crédit épuisé, l&apos;appel se termine automatiquement :{" "}
              <strong className="text-aubergine">
                vous ne dépassez jamais votre budget
              </strong>
              .
            </span>
          </li>
        </ul>

        {/* Rappel de l'action quand Elena est en ligne (fin de page) */}
        {enLigne && (
          <button
            onClick={handleAppel}
            disabled={appelEnCours}
            className="mt-10 inline-block rounded-full bg-cta px-8 py-3.5 font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
          >
            {appelEnCours ? "Connexion en cours…" : "J'appelle Elena maintenant"}
          </button>
        )}
        </div>
      </section>
    </div>
  );
}
