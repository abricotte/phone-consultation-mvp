"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// LANCER UNE CONSULTATION MINUTÉE — pour un rendez-vous déjà réglé.
//
// Vit dans l'onglet Calendly (décision d'Elena) : c'est un geste Calendly
// par nature. Placé à côté de la liste des rendez-vous, il devient le
// repli naturel — la cliente n'est pas dans la liste, on la lance à la
// main.
//
// Aucun débit de crédit : le forfait est déjà payé côté Calendly. Le
// serveur pose une session `forfait_manuel` qui porte le montant.

interface Forfait {
  code: string;
  nom: string;
  minutes: number;
  prix: number;
}

export default function ConsultationMinutee({
  telephoneInitial = "",
}: {
  /** Pré-remplir depuis un rendez-vous (« lancer l'appel » sur une ligne) */
  telephoneInitial?: string;
} = {}) {
  const [forfaits, setForfaits] = useState<Forfait[]>([]);
  const [enConsultation, setEnConsultation] = useState(false);
  const [telephone, setTelephone] = useState(telephoneInitial);
  const [forfaitCode, setForfaitCode] = useState("");
  const [lancement, setLancement] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api
      .adminGetStatut()
      .then((s: { forfaits?: Forfait[]; statut?: string }) => {
        setForfaits(s.forfaits || []);
        setEnConsultation(s.statut === "en_consultation");
        if (s.forfaits?.length && !forfaitCode) setForfaitCode(s.forfaits[0].code);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lancer(e: React.FormEvent) {
    e.preventDefault();
    setLancement(true);
    setErreur("");
    setMessage("");
    try {
      const data = await api.adminLancerConsultation(telephone, forfaitCode);
      setMessage(data.message);
      setTelephone("");
      setEnConsultation(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur au lancement");
    } finally {
      setLancement(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-mention">
        Votre téléphone sonne d&apos;abord, puis la cliente est appelée.
        Coupure automatique à la durée choisie, signal 2 minutes avant la
        fin. Aucun débit de crédit.
      </p>

      <form onSubmit={lancer} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-aubergine">
            Numéro de la cliente
          </label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="06 12 34 56 78"
            required
            className="w-full max-w-xs rounded-lg border border-greige bg-white px-3 py-2.5 text-aubergine"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-aubergine">Durée</p>
          <div className="flex flex-wrap gap-2.5">
            {forfaits.map((f) => (
              <button
                key={f.code}
                type="button"
                onClick={() => setForfaitCode(f.code)}
                className={`rounded-xl border px-4 py-2.5 text-center transition ${
                  forfaitCode === f.code
                    ? "border-cta bg-blush shadow-card"
                    : "border-greige/70 bg-ivory/60 hover:border-cta/50"
                }`}
              >
                <span className="block text-lg font-bold tracking-tight text-aubergine">
                  {f.minutes} min
                </span>
                <span className="text-xs text-mention">{f.nom}</span>
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">📞 {message}</p>
        )}
        {erreur && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{erreur}</p>
        )}

        <button
          type="submit"
          disabled={lancement || enConsultation}
          className="w-full rounded-full bg-cta px-8 py-3 font-bold text-cta-text shadow-card transition hover:bg-cta-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {lancement
            ? "Lancement de l'appel…"
            : enConsultation
              ? "Consultation en cours…"
              : "Lancer l'appel"}
        </button>
      </form>
    </div>
  );
}
