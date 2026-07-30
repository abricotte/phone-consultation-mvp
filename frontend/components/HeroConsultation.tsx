"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useElenaStatus, type ElenaStatus } from "@/components/useElenaStatus";

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
  const statutReel = useElenaStatus();
  const statut = statutDemo ?? statutReel;

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
    <section className="relative overflow-hidden rounded-3xl border border-greige/60 bg-gradient-to-br from-blush via-cream to-cream p-6 shadow-soft sm:p-7">
      <span aria-hidden className="pointer-events-none absolute right-8 top-5 text-lg text-gold/50">✦</span>
      <span aria-hidden className="pointer-events-none absolute right-20 top-12 text-xs text-coral/40">✦</span>
      <span aria-hidden className="pointer-events-none absolute right-32 top-6 text-[0.6rem] text-gold/40">✦</span>

      {/* Statut + crédit */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {statut === "chargement" && (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-mention">
              <span className="h-2 w-2 rounded-full bg-greige" />
              Vérification…
            </span>
          )}
          {statut === "disponible" && (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-statut-online">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-statut-online" />
              </span>
              Elena est en ligne
            </span>
          )}
          {statut === "en_consultation" && (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Elena est en consultation
            </span>
          )}
          {statut === "hors_ligne" && (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-mention">
              <span className="h-2 w-2 rounded-full bg-statut-offline" />
              Elena n&apos;est pas en ligne
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-1 text-sm text-aubergine ring-1 ring-greige/60">
          <span aria-hidden className="text-gold">☾</span>
          <span className="font-semibold">{soldeMinutes} min</span>
          <span className="text-mention">de crédit</span>
        </span>
      </div>

      <h2 className="mt-3 font-serif text-2xl font-semibold text-aubergine sm:text-3xl">
        Consultation Immédiate
      </h2>

      {/* Action principale — selon statut et crédit */}
      <div className="mt-4">
        {enLigne && creditSuffisant && (
          <button
            onClick={handleAppel}
            disabled={appelEnCours}
            className="w-full rounded-full bg-cta px-6 py-4 text-lg font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
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
              className="whitespace-nowrap rounded-full border border-cta-outline px-6 py-3 text-center font-medium text-prix transition hover:bg-cta hover:text-cta-text"
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
      <div className="mt-5 border-t border-greige/50 pt-4">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-mention">
          Recharge express
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {suggestionsMinutes.map((m) => {
            const chargement = rechargeEnCours === m;
            const primaire = !creditSuffisant;
            return (
              <button
                key={m}
                onClick={() => handleRechargeExpress(m)}
                disabled={rechargeEnCours !== null}
                className={`rounded-2xl px-3 py-3 text-center transition disabled:opacity-50 ${
                  primaire
                    ? "bg-cta text-cta-text shadow-card hover:bg-cta-dark"
                    : "border border-greige/70 bg-ivory text-aubergine hover:border-cta/40"
                }`}
              >
                <span className="block font-serif text-xl font-semibold">
                  {chargement ? "…" : `+${m} min`}
                </span>
                <span className={`text-xs ${primaire ? "text-cta-text/90" : "text-mention"}`}>
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
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
              <select
                value={autreMinutes}
                onChange={(e) => setAutreMinutes(Number(e.target.value))}
                aria-label="Choisir une durée"
                className="rounded-xl border border-greige bg-ivory px-3 py-2.5 text-aubergine focus:border-cta-outline focus:outline-none"
              >
                {dureesPossibles.map((m) => (
                  <option key={m} value={m}>
                    {m} min — {prixDe(m, prixMinuteCents)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRechargeExpress(autreMinutes)}
                disabled={rechargeEnCours !== null}
                className="whitespace-nowrap rounded-full bg-cta px-5 py-2.5 font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
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
