"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  useElenaPresence,
  heureRetour,
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

  // Durée personnalisée (repliée par défaut)
  const [autreOuvert, setAutreOuvert] = useState(false);
  const [autreMinutes, setAutreMinutes] = useState(maxMinutes >= 45 ? 45 : maxMinutes);

  const enLigne = statut === "disponible";
  const creditSuffisant = soldeMinutes >= minimumMinutes;

  // Liste des durées possibles pour "Autre durée"
  const dureesPossibles: number[] = [];
  for (let m = minMinutes; m <= maxMinutes; m += pasMinutes) {
    dureesPossibles.push(m);
  }

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

      {statut === "hors_ligne" && (
        <div className="mb-4 rounded-2xl bg-greige/25 px-5 py-4">
          <span className="flex flex-wrap items-center gap-3">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-statut-offline" />
            <span className="text-xl font-bold text-mention sm:text-2xl">
              Elena n&apos;est pas en ligne
            </span>
          </span>
          {/* Le message d'absence prime sur les heures habituelles :
              « en repos jusqu'au 15 » rend caduc « en ligne le soir ». */}
          {presence.messageAbsence ? (
            <p className="mt-1 pl-6 text-sm italic text-mention/80">
              {presence.messageAbsence}
            </p>
          ) : (
            presence.heuresIndicatives && (
              <p className="mt-1 pl-6 text-sm italic text-mention/80">
                {presence.heuresIndicatives}
              </p>
            )
          )}
        </div>
      )}

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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3.5 py-1.5 text-sm text-aubergine">
          <span aria-hidden className="text-gold">☾</span>
          <span className="font-semibold">{soldeMinutes} min</span>
          <span className="text-mention">de crédit · n&apos;expire jamais</span>
        </span>
      </div>

      <h2 className="mt-4 font-serif text-3xl font-semibold text-aubergine sm:text-4xl">
        Consultation Immédiate
      </h2>

      {/* Action principale — selon statut et crédit */}
      <div className="mt-5">
        {enLigne && creditSuffisant && (
          <button
            onClick={handleAppel}
            disabled={appelEnCours}
            className="w-full rounded-2xl bg-cta px-6 py-4 text-lg font-semibold text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
          >
            {appelEnCours ? "Connexion…" : "📞 J'appelle Elena maintenant"}
          </button>
        )}

        {enLigne && !creditSuffisant && (
          <p className="text-sm text-ink">
            Il vous faut au moins{" "}
            <strong className="text-aubergine">
              {minimumMinutes} min de crédit (
              {prixDe(minimumMinutes, prixMinuteCents)})
            </strong>{" "}
            pour appeler — rechargez en un geste ci-dessous.
          </p>
        )}

        {statut === "en_consultation" && (
          <p className="text-sm text-mention">
            Elena est en consultation — revenez dans quelques instants, ou
            préparez votre crédit dès maintenant.
          </p>
        )}

        {statut === "hors_ligne" && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href="https://elena-wolska.com/disponibilites"
              className="whitespace-nowrap rounded-2xl border border-cta-outline px-6 py-3 text-center font-medium text-prix transition hover:bg-cta hover:text-cta-text"
            >
              Voir les disponibilités →
            </a>
            <p className="text-sm text-mention">
              Rechargez dès maintenant pour être prête dès son retour.
            </p>
          </div>
        )}
      </div>

      {/* Recharge express — tout centralisé : 1 clic = paiement */}
      <div className="mt-6 border-t border-greige/40 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
          Recharge express
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
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

        {/* Autre durée — replié, dans le même bloc */}
        <div className="mt-3 text-center">
          {!autreOuvert ? (
            <button
              type="button"
              onClick={() => setAutreOuvert(true)}
              className="text-sm font-medium text-prix transition-colors hover:text-cta"
            >
              Autre durée
            </button>
          ) : (
            <div className="space-y-3">
              {/* La liste ne montre QUE les durées : le prix exact apparaît
                  une seule fois, après sélection (et sur le bouton). */}
              <div className="flex items-center justify-center gap-4">
                <select
                  value={autreMinutes}
                  onChange={(e) => setAutreMinutes(Number(e.target.value))}
                  aria-label="Choisir une durée"
                  className="rounded-2xl border border-greige bg-cream/60 px-4 py-2.5 text-aubergine transition focus:border-cta-outline focus:outline-none"
                >
                  {dureesPossibles.map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
                <span className="font-serif text-2xl font-semibold text-prix">
                  {prixDe(autreMinutes, prixMinuteCents)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRechargeExpress(autreMinutes)}
                disabled={rechargeEnCours !== null}
                className="w-full whitespace-nowrap rounded-2xl bg-cta px-5 py-3 font-semibold text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
              >
                {rechargeEnCours === autreMinutes
                  ? "…"
                  : `Recharger ${autreMinutes} min — ${prixDe(autreMinutes, prixMinuteCents)}`}
              </button>
            </div>
          )}
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
