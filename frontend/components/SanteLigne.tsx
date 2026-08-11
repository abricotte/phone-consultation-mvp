"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { chargerReglages, rafraichirReglages, REGLAGES_DEFAUT } from "@/lib/reglages";

interface Ligne {
  disponible: boolean;
  montant?: number;
  devise?: string;
  raison?: string;
  minutesEstimees: number | null;
  coutMinuteEstime: number;
  numeroLigne: string | null;
}

interface Controle {
  cle: string;
  libelle: string;
  ok: boolean;
  detail: string;
}

interface Autotest {
  pret: boolean;
  controles: Controle[];
  testeLe: string;
}

// Sous le seuil d'alerte (réglable dans « Mon profil »), la ligne ne
// tiendra pas la journée ; sous 1 €, les appels échouent purement et
// simplement. Seuls ces deux cas justifient que ce bloc s'impose.
const SEUIL_CRITIQUE = 1;

// Deux rendus : "alerte" (remonte en haut du cabinet, uniquement si le
// solde est bas) et "pied" (une ligne discrète en bas de page).
export default function SanteLigne({
  variante = "pied",
}: {
  variante?: "pied" | "alerte";
}) {
  const [ligne, setLigne] = useState<Ligne | null>(null);
  const [test, setTest] = useState<Autotest | null>(null);
  const [testEnCours, setTestEnCours] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  // Seuil réglé dans « Mon profil » — pas une constante figée
  const [seuilBas, setSeuilBas] = useState(REGLAGES_DEFAUT.seuilTwilio);

  useEffect(() => {
    // chargerReglages() ne rend que le dernier état connu, éventuellement
    // vide ; la base tranche.
    setSeuilBas(chargerReglages().seuilTwilio);
    rafraichirReglages()
      .then((r) => setSeuilBas(r.seuilTwilio))
      .catch(() => {});
    api
      .adminGetLigne()
      .then((l: Ligne) => setLigne(l))
      .catch(() => setLigne(null));
  }, []);

  async function lancerTest() {
    setTestEnCours(true);
    setOuvert(true);
    try {
      setTest(await api.adminAutotest());
    } catch {
      setTest(null);
    } finally {
      setTestEnCours(false);
    }
  }

  const soldeConnu = ligne?.disponible && typeof ligne.montant === "number";
  const montant = soldeConnu ? ligne!.montant! : null;
  const bas = montant !== null && montant < seuilBas;
  const critique = montant !== null && montant < SEUIL_CRITIQUE;

  // En variante "alerte", on ne s'affiche QUE si le solde est bas.
  if (variante === "alerte" && !bas) return null;

  if (variante === "alerte") {
    return (
      <div
        className={`mt-4 rounded-2xl border-2 px-5 py-4 ${
          critique ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
        }`}
      >
        <p
          className={`text-sm font-bold ${
            critique ? "text-red-700" : "text-amber-800"
          }`}
        >
          {critique
            ? `⛔ Ligne épuisée (${montant!.toFixed(2)} ${ligne!.devise}) — vos appels vont échouer`
            : `⚠️ Solde bas : ${montant!.toFixed(2)} ${ligne!.devise} — environ ${ligne!.minutesEstimees} min`}
        </p>
        <p className="mt-0.5 text-sm text-ink">
          Rechargez votre compte Twilio pour ne pas perdre de consultations.
        </p>
      </div>
    );
  }

  // Variante "pied" : discrète, dépliable
  return (
    <div className="mt-8 border-t border-greige/50 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p className="text-mention">
          Ligne téléphonique :{" "}
          {soldeConnu ? (
            <span className={bas ? "font-bold text-amber-700" : "font-semibold text-ink"}>
              {montant!.toFixed(2)} {ligne!.devise}
            </span>
          ) : (
            <span className="text-mention">
              {ligne ? "solde non lisible" : "…"}
            </span>
          )}
          {soldeConnu && ligne!.minutesEstimees !== null && (
            <span className="text-mention"> · ~{ligne!.minutesEstimees} min</span>
          )}
        </p>

        <button
          onClick={lancerTest}
          disabled={testEnCours}
          className="text-sm font-medium text-prix underline-offset-2 transition hover:underline disabled:opacity-50"
        >
          {testEnCours ? "Vérification…" : "Suis-je joignable ?"}
        </button>
      </div>

      {ouvert && test && (
        <div className="mt-3 rounded-2xl border border-greige/50 bg-ivory p-4">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-sm font-bold ${
                test.pret ? "text-statut-online" : "text-red-600"
              }`}
            >
              {test.pret
                ? "✓ Tout est prêt — vous pouvez ouvrir votre ligne."
                : "✕ Un point bloque."}
            </p>
            <button
              onClick={() => setOuvert(false)}
              aria-label="Fermer"
              className="shrink-0 text-mention hover:text-aubergine"
            >
              ✕
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {test.controles.map((c) => (
              <li key={c.cle} className="flex items-start gap-2 text-sm">
                <span
                  aria-hidden
                  className={`mt-0.5 shrink-0 ${
                    c.ok ? "text-statut-online" : "text-red-600"
                  }`}
                >
                  {c.ok ? "✓" : "✕"}
                </span>
                <span className="min-w-0">
                  <span className={c.ok ? "text-ink" : "font-bold text-red-700"}>
                    {c.libelle}
                  </span>
                  <span className="break-all text-mention"> — {c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
