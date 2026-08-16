"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  useElenaPresence,
  heureRetour,
  heureParis,
  libellePermanence,
  type ElenaStatus,
} from "@/components/useElenaStatus";

// Hero de l'espace cliente : LE geste le plus direct.
// Statut d'Elena + crédit + gros bouton d'appel + recharge express en
// 1 clic (droit vers le paiement Stripe, sans étape intermédiaire).
interface Props {
  soldeMinutes: number;
  minimumMinutes: number;
  prixMinuteCents: number;
  // Durées rapides + bornes de la durée personnalisée
  suggestionsMinutes?: number[];
  minMinutes?: number;
  maxMinutes?: number;
  pasMinutes?: number;
  // Aperçu/tests uniquement : force le statut au lieu du polling réel
  statutDemo?: ElenaStatus;
}


/** « 14,50 € » — le prix d'un nombre de minutes au tarif courant */
function prixDe(minutes: number, cents: number): string {
  const t = minutes * cents;
  return t % 100 === 0
    ? `${t / 100} €`
    : `${(t / 100).toFixed(2).replace(".", ",")} €`;
}

/**
 * Le visage d'Elena, avec l'état en badge dans le coin — comme une
 * messagerie. La couleur continue de dire l'état ; le visage dit QUI :
 * c'est elle qui est là, pas un point vert. Le pouls (ping) est réservé
 * aux états où quelque chose est en train de se passer.
 */
function AvatarStatut({
  couleur,
  pouls = false,
}: {
  couleur: string;
  pouls?: boolean;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/elena-avatar.png"
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-soft"
      />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
        {pouls && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${couleur}`}
          />
        )}
        <span
          className={`relative inline-flex h-4 w-4 rounded-full ring-2 ring-white ${couleur}`}
        />
      </span>
    </span>
  );
}

export default function HeroConsultation({
  soldeMinutes,
  minimumMinutes,
  prixMinuteCents,
  suggestionsMinutes = [10, 20, 30],
  minMinutes = 5,
  maxMinutes = 90,
  pasMinutes = 5,
  statutDemo,
}: Props) {
  const presence = useElenaPresence();
  const statut = statutDemo ?? presence.statut;
  // « De retour vers 15 h » — porte qui dit quand elle rouvre
  const retour = heureRetour(presence.retourPrevu);

  const [appelEnCours, setAppelEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const enLigne = statut === "disponible";
  const creditSuffisant = soldeMinutes >= minimumMinutes;

  // Une permanence AUJOURD'HUI change tout le ton de l'ecran : ce n'est
  // plus une porte close, c'est une promesse — « Elena sera en ligne de
  // 17h45 a 19h ». Et si le credit manque, la porte pleine mene a la
  // recharge avec cette promesse pour raison : « vous serez prete ».
  const prochaine = presence.permanence.prochaine;
  const permanenceAujourdhui =
    !!prochaine &&
    statut === "hors_ligne" &&
    !presence.messageAbsence &&
    new Date(prochaine.debut).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }) ===
      new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });


  async function handleAppel() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setAppelEnCours(true);
    setMessage("");
    setErreur("");
    try {
      const session = await api.createSession();
      setMessage("Session créée, lancement de l'appel…");
      const call = await api.initiateCall(session.id);
      setMessage(
        `📞 C'est parti ! Votre téléphone va sonner${
          call.maxMinutes
            ? ` — jusqu'à ${call.maxMinutes} min avec votre crédit`
            : ""
        }.`
      );
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'appel");
    } finally {
      setAppelEnCours(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-greige/40 bg-ivory p-6 shadow-soft sm:p-8">
      {/* Étoiles décoratives — descendues sous la bannière de statut,
          qui occupe désormais le haut de la carte : elles tombaient
          dessus et ressemblaient à une maladresse plutôt qu'à un ornement. */}
      <span aria-hidden className="pointer-events-none absolute right-8 top-28 text-lg text-gold/50">✦</span>
      <span aria-hidden className="pointer-events-none absolute right-20 top-36 text-xs text-coral/40">✦</span>
      <span aria-hidden className="pointer-events-none absolute right-32 top-32 text-[0.6rem] text-gold/40">✦</span>

      {/* BANNIÈRE DE STATUT — pleine largeur.
          C'est la première chose que la cliente cherche en arrivant :
          peut-elle appeler MAINTENANT ? Elle tenait en 11 px, plus
          discrète que le texte qui l'entourait.
          Le ton reste une INVITATION, jamais une pression : pas de
          compte à rebours, pas d'urgence fabriquée. « Elle est là »
          suffit — c'est l'information qui manquait, pas l'insistance. */}
      {statut === "disponible" && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-statut-online/10 px-5 py-4 ring-1 ring-statut-online/25">
          <AvatarStatut couleur="bg-statut-online" pouls />
          <span className="text-xl font-bold text-statut-online sm:text-2xl">
            Elena est en ligne
          </span>
          <span className="text-sm text-ink/70">
            — vous pouvez l&apos;appeler maintenant
          </span>
        </div>
      )}

      {statut === "en_consultation" && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-amber-200">
          <AvatarStatut couleur="bg-amber-500" />
          <span className="text-xl font-bold text-amber-700 sm:text-2xl">
            Elena est en consultation
          </span>
          {retour && (
            // L'heure de retour informe, elle ne crie pas — c'est le
            // statut qui doit sauter aux yeux.
            <span className="text-sm font-medium text-amber-700/80">
              de retour vers {retour}
            </span>
          )}
        </div>
      )}

      {/* HORS LIGNE — les écriteaux de permanence, par priorité :
          absence > permanence en cours (« Elena arrive ») > prochaine
          permanence > semaine sans permanence > heures habituelles.
          « Le calendrier annonce, le bouton fait foi » : rien ici
          n'ouvre un appel, tout dit seulement quand revenir. */}
      {statut === "hors_ligne" &&
        (presence.messageAbsence ? (
          <div className="mb-4 rounded-2xl bg-greige/25 px-5 py-4">
            <span className="flex flex-wrap items-center gap-3">
              <AvatarStatut couleur="bg-statut-offline" />
              <span className="text-xl font-bold text-mention sm:text-2xl">
                Elena n&apos;est pas en ligne
              </span>
            </span>
            <p className="mt-1 pl-[4.25rem] text-sm italic text-mention/80">
              {presence.messageAbsence}
            </p>
          </div>
        ) : presence.permanence.enCours ? (
          // Bascule éteinte pendant un créneau : le retard devient bénin.
          <div className="mb-4 rounded-2xl bg-gold/10 px-5 py-4 ring-1 ring-gold/30">
            <span className="flex flex-wrap items-center gap-3">
              <AvatarStatut couleur="bg-gold" pouls />
              <span className="text-xl font-bold text-gold-dark sm:text-2xl">
                Permanence en cours — Elena arrive
              </span>
            </span>
            <p className="mt-1 pl-[4.25rem] text-sm text-mention">
              Prévue de {heureParis(presence.permanence.enCours.debut)} à{" "}
              {heureParis(presence.permanence.enCours.fin)} · restez à proximité
            </p>
          </div>
        ) : permanenceAujourdhui && prochaine ? (
          // Une permanence AUJOURD'HUI : on l'annonce en positif — « sera
          // en ligne » — pas en creux — « n'est pas en ligne ».
          <div className="mb-4 rounded-2xl bg-gold/10 px-5 py-4 ring-1 ring-gold/30">
            <span className="flex flex-wrap items-center gap-3">
              <AvatarStatut couleur="bg-gold" />
              <span className="text-xl font-bold text-gold-dark sm:text-2xl">
                Elena sera en ligne aujourd&apos;hui, de{" "}
                {heureParis(prochaine.debut)} à {heureParis(prochaine.fin)}
              </span>
            </span>
            <p className="mt-1 pl-[4.25rem] text-sm text-mention">
              Vous pourrez l&apos;appeler à la minute pendant ce créneau.
            </p>
          </div>
        ) : prochaine ? (
          <div className="mb-4 rounded-2xl bg-greige/25 px-5 py-4">
            <span className="flex flex-wrap items-center gap-3">
              <AvatarStatut couleur="bg-statut-offline" />
              <span className="text-xl font-bold text-mention sm:text-2xl">
                Prochaine permanence :{" "}
                {libellePermanence(prochaine)}
              </span>
            </span>
            <p className="mt-1 pl-[4.25rem] text-sm italic text-mention/80">
              à la minute pendant la permanence — ou réservez un créneau
            </p>
          </div>
        ) : presence.permanence.actives ? (
          <div className="mb-4 rounded-2xl bg-greige/25 px-5 py-4">
            <span className="flex flex-wrap items-center gap-3">
              <AvatarStatut couleur="bg-statut-offline" />
              <span className="text-xl font-bold text-mention sm:text-2xl">
                Pas de permanence cette semaine
              </span>
            </span>
            <p className="mt-1 pl-[4.25rem] text-sm italic text-mention/80">
              les consultations se font sur rendez-vous — Découverte ou Complète
            </p>
          </div>
        ) : (
          <div className="mb-4 rounded-2xl bg-greige/25 px-5 py-4">
            <span className="flex flex-wrap items-center gap-3">
              <AvatarStatut couleur="bg-statut-offline" />
              <span className="text-xl font-bold text-mention sm:text-2xl">
                Elena n&apos;est pas en ligne
              </span>
            </span>
            {presence.heuresIndicatives && (
              <p className="mt-1 pl-[4.25rem] text-sm italic text-mention/80">
                {presence.heuresIndicatives}
              </p>
            )}
          </div>
        ))}

      {statut === "chargement" && (
        <div className="mb-4 rounded-2xl bg-greige/20 px-5 py-4">
          <span className="inline-flex items-center gap-3 text-base text-mention">
            <AvatarStatut couleur="bg-greige" />
            Vérification…
          </span>
        </div>
      )}

      {/* « n'expire jamais » accolé au solde : c'est LA différence avec
          les plateformes, elle se lit en même temps que le chiffre. */}
      <p className="mt-1 text-center text-sm text-mention">
        Votre crédit :{" "}
        <span className="font-bold text-aubergine">{soldeMinutes} min</span>
        {/* Quand une permanence approche et que le crédit manque, la
            ligne dit le minimum : la cliente comprend AVANT de cliquer
            pourquoi la porte mène à la recharge. */}
        {permanenceAujourdhui && !creditSuffisant
          ? ` — il faut au moins ${minimumMinutes} min (${prixDe(minimumMinutes, prixMinuteCents)}) pour appeler`
          : " · n'expire jamais"}
      </p>

      {/* DEUX PORTES — le cœur de l'espace, dessiné par Elena.
          « L'accueil décide, l'écran suivant exécute » : ici, AUCUNE
          recharge — elle vit sur Mon crédit, et seulement là.
          Le bouton d'appel dit toujours la même chose mais mène soit à
          l'appel, soit à la recharge, selon ce qui est nécessaire : la
          cliente ne choisit jamais entre « appeler » et « recharger »,
          le système sait. Et quand l'appel est impossible, le LIBELLÉ
          change — proposer une action impossible frustre plus que de ne
          rien proposer. */}
      <div className="mt-4 space-y-3">
        {enLigne && creditSuffisant ? (
          <button
            onClick={handleAppel}
            disabled={appelEnCours}
            className="w-full rounded-2xl bg-cta px-6 py-4 text-center shadow-card transition hover:bg-cta-dark disabled:opacity-50"
          >
            <span className="block text-lg font-semibold text-cta-text">
              {appelEnCours ? "Connexion…" : "Appeler maintenant"}
            </span>
            <span className="block text-xs text-cta-text/80">
              à la minute, pendant les permanences
            </span>
          </button>
        ) : enLigne ? (
          // Même libellé, autre destination : la recharge, avec la raison.
          <a
            href="/credit?pour=appeler"
            className="block w-full rounded-2xl bg-cta px-6 py-4 text-center shadow-card transition hover:bg-cta-dark"
          >
            <span className="block text-lg font-semibold text-cta-text">
              Appeler maintenant
            </span>
            <span className="block text-xs text-cta-text/80">
              il vous reste {soldeMinutes} min — rechargez pour appeler
            </span>
          </a>
        ) : permanenceAujourdhui && prochaine && !creditSuffisant ? (
          // Elle pourra appeler dans quelques heures et n'a pas le credit :
          // la porte pleine mene a la recharge, avec la promesse pour raison.
          <a
            href="/credit?pour=appeler"
            className="block w-full rounded-2xl bg-cta px-6 py-4 text-center shadow-card transition hover:bg-cta-dark"
          >
            <span className="block text-lg font-semibold text-cta-text">
              Préparer mon crédit pour l&apos;appeler
            </span>
            <span className="block text-xs text-cta-text/80">
              rechargez maintenant — vous serez prête à {heureParis(prochaine.debut)}
            </span>
          </a>
        ) : permanenceAujourdhui && prochaine ? (
          // Credit suffisant, permanence a venir : elle est prete, on le dit.
          <div className="w-full rounded-2xl border border-gold/40 bg-gold/5 px-6 py-4 text-center">
            <span className="block text-lg font-semibold text-gold-dark">
              Vous êtes prête pour {heureParis(prochaine.debut)}
            </span>
            <span className="block text-xs text-mention">
              revenez à cette heure — le bouton d&apos;appel apparaîtra
            </span>
          </div>
        ) : (
          // Appel impossible : simple constat, pas un bouton.
          <div className="w-full rounded-2xl border border-greige/70 bg-cream/50 px-6 py-4 text-center">
            <span className="block text-lg font-semibold text-aubergine/70">
              {statut === "en_consultation"
                ? "Appeler dès qu'Elena se libère"
                : "Appeler pendant la permanence"}
            </span>
            <span className="block text-xs text-mention">
              {statut === "en_consultation" && retour
                ? `de retour vers ${retour}`
                : presence.permanence.prochaine
                  ? `prochaine : ${libellePermanence(presence.permanence.prochaine)}`
                  : "à la minute, quand Elena est en ligne"}
            </span>
          </div>
        )}

        <a
          href="https://elena-wolska.com/disponibilites"
          className={`block w-full rounded-2xl px-6 py-4 text-center transition ${
            (enLigne && creditSuffisant) || (permanenceAujourdhui && !creditSuffisant)
              ? "border border-greige/70 bg-white text-aubergine hover:border-cta/50"
              : "bg-cta text-cta-text shadow-card hover:bg-cta-dark"
          }`}
        >
          <span className="block text-lg font-semibold">Réserver un créneau</span>
          <span
            className={`block text-xs ${
              (enLigne && creditSuffisant) || (permanenceAujourdhui && !creditSuffisant)
                ? "text-mention"
                : "text-cta-text/80"
            }`}
          >
            au calendrier · Découverte 20 min ou Complète 45 min
          </span>
        </a>

        <a
          href="/credit"
          className="mx-auto block w-max text-sm font-medium text-mention underline decoration-greige underline-offset-4 transition hover:text-aubergine"
        >
          {permanenceAujourdhui && !creditSuffisant
            ? "Recharger sans appeler"
            : "Recharger mon crédit"}
        </a>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
          {message}
        </p>
      )}
      {erreur && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {erreur}
        </p>
      )}
    </section>
  );
}
