"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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

// Seuil d'alerte : en dessous, la ligne ne tiendra pas une consultation
// complète et les appels échoueront en silence.
const SEUIL_BAS = 5;

export default function SanteLigne() {
  const [ligne, setLigne] = useState<Ligne | null>(null);
  const [test, setTest] = useState<Autotest | null>(null);
  const [testEnCours, setTestEnCours] = useState(false);

  useEffect(() => {
    api
      .adminGetLigne()
      .then((l: Ligne) => setLigne(l))
      .catch(() => setLigne(null));
  }, []);

  async function lancerTest() {
    setTestEnCours(true);
    try {
      const r = await api.adminAutotest();
      setTest(r);
    } catch {
      setTest(null);
    } finally {
      setTestEnCours(false);
    }
  }

  const soldeConnu = ligne?.disponible && typeof ligne.montant === "number";
  const bas = soldeConnu && ligne!.montant! < SEUIL_BAS;
  const vide = soldeConnu && ligne!.montant! < 1;

  return (
    <section
      className={`mt-6 rounded-3xl border p-6 shadow-soft ${
        vide
          ? "border-red-300 bg-red-50/60"
          : bas
          ? "border-amber-300 bg-amber-50/50"
          : "border-greige/50 bg-ivory"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
            Votre ligne téléphonique
          </p>

          {soldeConnu ? (
            <>
              <p
                className={`mt-1 font-serif text-2xl font-semibold tabular-nums ${
                  vide ? "text-red-600" : bas ? "text-amber-700" : "text-aubergine"
                }`}
              >
                {ligne!.montant!.toFixed(2)} {ligne!.devise}
              </p>
              <p className="text-xs text-mention">
                {ligne!.minutesEstimees !== null
                  ? `environ ${ligne!.minutesEstimees} min d'appel`
                  : "—"}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-mention">
              {ligne
                ? "Solde non lisible (compte post-payé ou permission absente)"
                : "Vérification…"}
            </p>
          )}
        </div>

        <button
          onClick={lancerTest}
          disabled={testEnCours}
          className="rounded-full border border-cta-outline px-5 py-2.5 text-sm font-medium text-prix transition hover:bg-cta hover:text-cta-text disabled:opacity-50"
        >
          {testEnCours ? "Vérification…" : "Suis-je joignable ?"}
        </button>
      </div>

      {vide && (
        <p className="mt-4 rounded-xl bg-red-100/70 px-4 py-2.5 text-sm font-medium text-red-700">
          ⛔ Solde épuisé — vos appels échoueront. Rechargez votre compte Twilio
          avant de passer en ligne.
        </p>
      )}
      {bas && !vide && (
        <p className="mt-4 rounded-xl bg-amber-100/70 px-4 py-2.5 text-sm font-medium text-amber-800">
          ⚠️ Solde bas — pensez à recharger votre compte Twilio pour ne pas
          perdre de consultations.
        </p>
      )}

      {test && (
        <div className="mt-5 border-t border-greige/50 pt-4">
          <p
            className={`text-sm font-semibold ${
              test.pret ? "text-statut-online" : "text-red-600"
            }`}
          >
            {test.pret
              ? "✓ Tout est prêt — vous pouvez ouvrir votre ligne."
              : "✕ Un point bloque — voyez ci-dessous."}
          </p>
          <ul className="mt-2 space-y-1.5">
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
                <span>
                  <span className={c.ok ? "text-ink" : "font-medium text-red-700"}>
                    {c.libelle}
                  </span>
                  <span className="text-mention"> — {c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
