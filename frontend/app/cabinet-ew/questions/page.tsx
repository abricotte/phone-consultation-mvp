"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import CabinetShell from "@/components/CabinetShell";

// QUESTIONS — ce que les clientes posent ou proposent dans le petit salon
// (migrations 016 et 020). Non lues d'abord. Elena peut répondre en
// quelques lignes : la réponse n'apparaît que chez la cliente qui a écrit,
// sous sa question, sans mail. Un onglet à part (Elena, 16 octobre).

type Suggestion = { id: string; clientId: string; prenom: string; nom: string; texte: string; lue: boolean; creeLe: string; reponse?: string | null; reponduLe?: string | null };

function dateCourte(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function QuestionsPage() {
  const [idees, setIdees] = useState<Suggestion[]>([]);
  const [toutesIdees, setToutesIdees] = useState(false);
  // Répondre à une question (migration 020) : la réponse n'est visible que de la cliente
  const [brouillons, setBrouillons] = useState<Record<string, string>>({});
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [envoiReponse, setEnvoiReponse] = useState(false);

  useEffect(() => {
    api.adminGetSuggestions()
      .then((d: { suggestions: Suggestion[] }) => setIdees(d?.suggestions ?? []))
      .catch(() => {});
  }, []);

  async function marquerLue(id: string, lue: boolean) {
    const d = await api.adminMajSuggestion(id, { lue }).catch(() => null);
    if (!d?.suggestion) return;
    setIdees((is) => is.map((i) => (i.id === id ? { ...i, lue } : i)));
  }
  async function repondre(id: string) {
    const texte = (brouillons[id] ?? "").trim();
    setEnvoiReponse(true);
    const d = await api.adminMajSuggestion(id, { reponse: texte || null }).catch(() => null);
    setEnvoiReponse(false);
    if (!d?.suggestion) return;
    setIdees((is) => is.map((i) => (i.id === id ? { ...i, lue: d.suggestion.lue, reponse: d.suggestion.reponse, reponduLe: d.suggestion.reponduLe } : i)));
    setOuverte(null);
  }
  const ideesVisibles = toutesIdees ? idees : idees.filter((i) => !i.lue);
  const ideesNonLues = idees.filter((i) => !i.lue).length;

  return (
    <CabinetShell>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">Questions</h1>
            <p className="mt-1 text-sm text-mention">
              Leurs questions et leurs idées, posées dans le salon. {ideesNonLues > 0 ? `${ideesNonLues} à lire.` : "Rien de nouveau."}
            </p>
          </div>
          {idees.some((i) => i.lue) && (
            <button type="button" onClick={() => setToutesIdees((v) => !v)} className="text-xs text-mention hover:underline">
              {toutesIdees ? "Masquer les idées lues" : `Voir aussi les idées lues (${idees.filter((i) => i.lue).length})`}
            </button>
          )}
        </div>
        {ideesVisibles.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-6 text-center text-sm text-mention">
            {idees.length === 0 ? "Aucune idée pour l'instant — la boîte est dans le salon, sous les petites clefs." : "Tout est lu."}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {ideesVisibles.map((i) => (
              <li key={i.id} className={`flex flex-wrap items-start justify-between gap-3 rounded-2xl border px-5 py-4 ${i.lue ? "border-greige/40 bg-cream/50" : "border-gold/30 bg-ivory shadow-soft"}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[16px] italic leading-relaxed text-ink">« {i.texte} »</p>
                  <p className="mt-1.5 text-xs text-mention">
                    <a href={`/cabinet-ew/clientes/${i.clientId}`} className="font-medium text-prix hover:underline">{i.prenom} {i.nom}</a>
                    {" · "}{dateCourte(i.creeLe)}
                  </p>
                  {i.reponse && ouverte !== i.id && (
                    <p className="mt-2 rounded-xl border-l-4 border-gold/60 bg-white px-3 py-2 text-sm leading-relaxed text-ink">
                      {i.reponse}
                      <span className="mt-1 block text-[11px] text-mention">Votre réponse{i.reponduLe ? ` · ${dateCourte(i.reponduLe)}` : ""} — elle seule la voit</span>
                    </p>
                  )}
                  {ouverte === i.id ? (
                    <div className="mt-2">
                      <textarea
                        rows={4}
                        maxLength={2000}
                        value={brouillons[i.id] ?? i.reponse ?? ""}
                        onChange={(e) => setBrouillons((b) => ({ ...b, [i.id]: e.target.value }))}
                        placeholder="Quelques lignes, pour elle seule…"
                        className="w-full rounded-xl border border-greige bg-white px-3 py-2 text-sm text-ink"
                      />
                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        <button type="button" disabled={envoiReponse} onClick={() => repondre(i.id)} className="rounded-full bg-aubergine px-4 py-1.5 text-xs font-semibold text-cream disabled:opacity-50">
                          {envoiReponse ? "Envoi…" : "Enregistrer ma réponse"}
                        </button>
                        <button type="button" onClick={() => setOuverte(null)} className="text-xs text-mention hover:underline">Annuler</button>
                        <span className="text-[11px] text-mention">Elle la verra dans le salon, sous sa question. Aucun mail n&apos;est envoyé.</span>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setOuverte(i.id)} className="mt-2 text-xs font-semibold text-prix hover:underline">
                      {i.reponse ? "Modifier ma réponse" : "Répondre"}
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input type="checkbox" checked={i.lue} onChange={(e) => marquerLue(i.id, e.target.checked)} /> lue
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </CabinetShell>
  );
}
