"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useElenaStatus } from "@/components/useElenaStatus";

// Carte d'appel réutilisable (dashboard cliente).
// Affiche le statut d'Elena et, quand elle est disponible, le bouton
// "J'appelle Elena maintenant" qui déclenche directement la mise en relation.
export default function AppelElenaCard() {
  const statut = useElenaStatus();
  const enLigne = statut === "disponible";

  const [appelEnCours, setAppelEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

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
    <div className="rounded-2xl border border-greige/60 bg-ivory p-6 shadow-soft">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <div className="mb-1 flex justify-center sm:justify-start">
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
          <p className="font-serif text-xl font-semibold text-aubergine">
            Consultation Immédiate
          </p>
          <p className="text-sm text-mention">
            {statut === "disponible"
              ? "Elena est disponible — appelez-la maintenant."
              : statut === "en_consultation"
              ? "Elena est en consultation, revenez dans quelques instants."
              : "Rechargez pour être prête dès qu'Elena se connecte."}
          </p>
        </div>

        {enLigne ? (
          <button
            onClick={handleAppel}
            disabled={appelEnCours}
            className="whitespace-nowrap rounded-full bg-cta px-6 py-3 font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
          >
            {appelEnCours ? "Connexion…" : "J'appelle Elena maintenant"}
          </button>
        ) : statut === "hors_ligne" ? (
          <a
            href="https://elena-wolska.com/disponibilites"
            className="whitespace-nowrap rounded-full border border-cta-outline px-6 py-3 font-medium text-prix transition hover:bg-cta hover:text-cta-text"
          >
            Voir les disponibilités →
          </a>
        ) : null}
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
    </div>
  );
}
