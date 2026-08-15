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

function prixDe(minutes: number, cents: number): string {
  const t = minutes * cents;
  return t % 100 === 0
    ? `${t / 100} €`
    : `${(t / 100).toFixed(2).replace(".", ",")} €`;
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
  const [rechargeEnCours, setRechargeEnCours] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  // Durée personnalisée, choisie au curseur — visible en permanence
  const [autreMinutes, setAutreMinutes] = useState(maxMinutes >= 45 ? 45 : maxMinutes);

  // La recharge se déplie sur demande — ouverte d'office si le crédit ne
  // permet pas d'appeler, car c'est alors la première chose à faire.
  const [rechargeOuverte, setRechargeOuverte] = useState(
    soldeMinutes < minimumMinutes
  );

  // Remplissage du curseur : la piste est orange jusqu'au pouce.
  // Bornes = celles de la recharge (minMinutes/maxMinutes), pas le
  // minimum d'appel — ce sont deux notions distinctes.
  const progression =
    maxMinutes > minMinutes
      ? Math.round(((autreMinutes - minMinutes) / (maxMinutes - minMinutes)) * 100)
      : 0;

  // Colonnes de la grille de recharge, selon le nombre de paliers cochés
  // dans le profil. Les classes sont écrites en toutes lettres : Tailwind
  // ne compile que ce qu'il lit dans le source, une classe construite par
  // concaténation n'existerait pas dans la feuille de style finale.
  const grilleRecharge =
    suggestionsMinutes.length <= 2
      ? "grid-cols-2"
      : suggestionsMinutes.length === 3
        ? "grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  const enLigne = statut === "disponible";
  const creditSuffisant = soldeMinutes >= minimumMinutes;


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

  // Recharge express : UN clic → paiement Stripe directement
  async function handleRechargeExpress(minutes: number) {
    setErreur("");
    setRechargeEnCours(minutes);
    try {
      const data = await api.topUp(minutes);
      if (data.url) {
        window.location.href = data.url;
        return; // on quitte la page vers Stripe
      }
      throw new Error("Paiement indisponible, réessayez.");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
      setRechargeEnCours(null);
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
          <span className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-statut-online" />
          </span>
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
          <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500" />
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
              <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-statut-offline" />
              <span className="text-xl font-bold text-mention sm:text-2xl">
                Elena n&apos;est pas en ligne
              </span>
            </span>
            <p className="mt-1 pl-6 text-sm italic text-mention/80">
              {presence.messageAbsence}
            </p>
          </div>
        ) : presence.permanence.enCours ? (
          // Bascule éteinte pendant un créneau : le retard devient bénin.
          <div className="mb-4 rounded-2xl bg-gold/10 px-5 py-4 ring-1 ring-gold/30">
            <span className="flex flex-wrap items-center gap-3">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-50" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-gold" />
              </span>
              <span className="text-xl font-bold text-gold-dark sm:text-2xl">
                Permanence en cours — Elena arrive
              </span>
            </span>
            <p className="mt-1 pl-6 text-sm text-mention">
              Prévue de {heureParis(presence.permanence.enCours.debut)} à{" "}
              {heureParis(presence.permanence.enCours.fin)} · restez à proximité
            </p>
          </div>
        ) : presence.permanence.prochaine ? (
          <div className="mb-4 rounded-2xl bg-greige/25 px-5 py-4">
            <span className="flex flex-wrap items-center gap-3">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-statut-offline" />
              <span className="text-xl font-bold text-mention sm:text-2xl">
                Prochaine permanence :{" "}
                {libellePermanence(presence.permanence.prochaine)}
              </span>
            </span>
            <p className="mt-1 pl-6 text-sm italic text-mention/80">
              à la minute pendant la permanence — ou réservez un créneau
            </p>
          </div>
        ) : presence.permanence.actives ? (
          <div className="mb-4 rounded-2xl bg-greige/25 px-5 py-4">
            <span className="flex flex-wrap items-center gap-3">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-statut-offline" />
              <span className="text-xl font-bold text-mention sm:text-2xl">
                Pas de permanence cette semaine
              </span>
            </span>
            <p className="mt-1 pl-6 text-sm italic text-mention/80">
              les consultations se font sur rendez-vous — Découverte ou Complète
            </p>
          </div>
        ) : (
          <div className="mb-4 rounded-2xl bg-greige/25 px-5 py-4">
            <span className="flex flex-wrap items-center gap-3">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-statut-offline" />
              <span className="text-xl font-bold text-mention sm:text-2xl">
                Elena n&apos;est pas en ligne
              </span>
            </span>
            {presence.heuresIndicatives && (
              <p className="mt-1 pl-6 text-sm italic text-mention/80">
                {presence.heuresIndicatives}
              </p>
            )}
          </div>
        ))}

      {statut === "chargement" && (
        <div className="mb-4 rounded-2xl bg-greige/20 px-5 py-4">
          <span className="inline-flex items-center gap-3 text-base text-mention">
            <span className="h-3.5 w-3.5 rounded-full bg-greige" />
            Vérification…
          </span>
        </div>
      )}

      {/* « n'expire jamais » accolé au solde : c'est LA différence avec
          les plateformes, elle se lit en même temps que le chiffre. */}
      <p className="mt-1 text-center text-sm text-mention">
        Votre crédit :{" "}
        <span className="font-bold text-aubergine">{soldeMinutes} min</span> ·
        n&apos;expire jamais
      </p>

      {/* DEUX PORTES — le cœur de l'espace, dessiné par Elena.
          Ses deux modèles de consultation deviennent deux boutons côte à
          côte : appeler maintenant (à la minute) ou réserver un créneau
          (forfaits Calendly). La porte PLEINE suit son statut — mettre en
          avant un appel impossible serait une porte peinte sur un mur.
          L'argent passe en coulisse : « Recharger mon crédit » n'est
          qu'un lien, qui déplie la recharge en dessous. */}
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
        ) : (
          <button
            onClick={() => {
              if (enLigne) {
                // En ligne mais crédit insuffisant : la porte mène à la
                // recharge, avec l'explication du minimum.
                setRechargeOuverte(true);
                setErreur(
                  `Il vous faut au moins ${minimumMinutes} min de crédit (${prixDe(minimumMinutes, prixMinuteCents)}) pour appeler.`
                );
              }
            }}
            className={`w-full rounded-2xl border border-greige/70 bg-cream/50 px-6 py-4 text-center transition ${
              enLigne ? "hover:border-cta/50" : "cursor-default"
            }`}
          >
            <span className="block text-lg font-semibold text-aubergine/70">
              Appeler maintenant
            </span>
            <span className="block text-xs text-mention">
              {enLigne
                ? `dès ${minimumMinutes} min de crédit — rechargez ci-dessous`
                : statut === "en_consultation"
                  ? "dès qu'Elena se libère"
                  : "à la minute, pendant les permanences"}
            </span>
          </button>
        )}

        <a
          href="https://elena-wolska.com/disponibilites"
          className={`block w-full rounded-2xl px-6 py-4 text-center transition ${
            enLigne && creditSuffisant
              ? "border border-greige/70 bg-white text-aubergine hover:border-cta/50"
              : "bg-cta text-cta-text shadow-card hover:bg-cta-dark"
          }`}
        >
          <span className="block text-lg font-semibold">Réserver un créneau</span>
          <span
            className={`block text-xs ${
              enLigne && creditSuffisant ? "text-mention" : "text-cta-text/80"
            }`}
          >
            au calendrier · Découverte 20 min ou Complète 45 min
          </span>
        </a>

        <button
          type="button"
          onClick={() => setRechargeOuverte(!rechargeOuverte)}
          className="mx-auto block text-sm font-medium text-mention underline decoration-greige underline-offset-4 transition hover:text-aubergine"
        >
          Recharger mon crédit
        </button>
      </div>

      {/* Recharge express — repliée derrière « Recharger mon crédit » :
          l'accueil propose d'abord la consultation, l'argent vient quand
          on le demande. Elle s'ouvre d'elle-même si le crédit ne suffit
          pas pour appeler. */}
      <div className={rechargeOuverte ? "mt-6 border-t border-greige/40 pt-5" : "hidden"}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
          Recharge express
        </p>
        {/* La grille suit le nombre de paliers choisis dans le profil :
            figée à trois colonnes, un quatrième palier se retrouvait seul
            sur sa ligne, comme un oubli. */}
        <div className={`mt-3 grid gap-2.5 ${grilleRecharge}`}>
          {suggestionsMinutes.map((m) => {
            const chargement = rechargeEnCours === m;
            const primaire = !creditSuffisant;
            return (
              <button
                key={m}
                onClick={() => handleRechargeExpress(m)}
                disabled={rechargeEnCours !== null}
                className={`rounded-2xl px-3 py-3.5 text-center transition disabled:opacity-50 ${
                  primaire
                    ? "bg-cta text-cta-text shadow-card hover:bg-cta-dark"
                    : "border border-greige/60 bg-cream/60 text-aubergine hover:border-cta/50 hover:bg-ivory"
                }`}
              >
                <span className="block text-lg font-bold tracking-tight">
                  {chargement ? "…" : `+${m} min`}
                </span>
                <span className={`text-xs font-medium ${primaire ? "text-cta-text/90" : "text-mention"}`}>
                  {prixDe(m, prixMinuteCents)}
                </span>
              </button>
            );
          })}
        </div>

        {/* CHOISIR SA DURÉE — ouvert d'emblée, avec un curseur.
            Le menu déroulant repliée derrière un lien laissait croire que
            le choix se limitait aux trois raccourcis. Or appeler pour la
            durée qu'on veut est la raison d'être de cet espace : la porte
            reste donc ouverte, et le prix suit le doigt. */}
        <div className="mt-4 rounded-2xl border-2 border-dashed border-cta/45 bg-cream/40 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-prix">
              Ou choisissez votre durée, à la minute près
            </span>
            <span className="text-xs italic text-mention">
              de {minMinutes} à {maxMinutes} min · {prixDe(1, prixMinuteCents)}/min
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <input
              type="range"
              min={minMinutes}
              max={maxMinutes}
              step={pasMinutes}
              value={autreMinutes}
              onChange={(e) => setAutreMinutes(Number(e.target.value))}
              aria-label="Choisir la durée en minutes"
              className="h-1.5 min-w-[9rem] flex-1 cursor-pointer appearance-none rounded-full bg-greige accent-cta"
              // #C24818 = couleur `cta` du theme (tailwind.config.ts) ;
              // un degrade inline ne peut pas lire les classes Tailwind.
              style={{
                background: `linear-gradient(90deg, #C24818 ${progression}%, #EFE3D5 ${progression}%)`,
              }}
            />
            <span className="rounded-2xl bg-aubergine px-4 py-2 text-center text-cream">
              <span className="block font-serif text-lg font-semibold tabular-nums">
                {autreMinutes} min
              </span>
              <span className="block text-xs text-cream/70 tabular-nums">
                {prixDe(autreMinutes, prixMinuteCents)}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleRechargeExpress(autreMinutes)}
            disabled={rechargeEnCours !== null}
            className="mt-4 w-full rounded-2xl bg-cta px-5 py-3.5 font-semibold text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
          >
            {rechargeEnCours === autreMinutes
              ? "…"
              : `Recharger ${autreMinutes} min — ${prixDe(autreMinutes, prixMinuteCents)}`}
          </button>
        </div>

        <p className="mt-3 text-center text-xs leading-relaxed text-mention">
          Un clic et vous passez au paiement sécurisé · minimum pour appeler :{" "}
          {minimumMinutes} min ({prixDe(minimumMinutes, prixMinuteCents)}) · votre
          crédit n&apos;expire jamais.
        </p>
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
