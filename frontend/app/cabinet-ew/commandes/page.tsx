"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetShell from "@/components/CabinetShell";

// COMMANDES — les tirages commandés depuis l'espace (migration 015). À
// faire d'abord, puis les livrées. Elena change le statut, coche le
// paiement, se laisse une note. Rien n'est envoyé à la cliente : son
// espace montre le statut quand elle revient.

type Commande = {
  id: string; clientId: string; prenom: string; nom: string;
  type: "pythie" | "grand_tableau"; question: string | null;
  statut: "recue" | "en_cours" | "livree" | "annulee";
  montant: number; paye: boolean; noteElena: string | null; creeLe: string; livreLe: string | null;
};
// Les idées de boosts soufflées depuis le salon (migration 016)
type Suggestion = { id: string; clientId: string; prenom: string; nom: string; texte: string; lue: boolean; creeLe: string; reponse?: string | null; reponduLe?: string | null };

const TYPES: Record<Commande["type"], string> = { pythie: "La Petite Pythie", grand_tableau: "Le Grand Tableau" };
const STATUTS: { code: Commande["statut"]; label: string; teinte: string }[] = [
  { code: "recue", label: "Reçue", teinte: "bg-[#FBF3E2] text-[#7A5A12]" },
  { code: "en_cours", label: "En cours", teinte: "bg-[#EBF2F7] text-[#2B4C6F]" },
  { code: "livree", label: "Livrée", teinte: "bg-[#EDF4EC] text-[#2F5D3A]" },
  { code: "annulee", label: "Annulée", teinte: "bg-greige/40 text-mention" },
];

function dateCourte(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function joursDepuis(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [onglet, setOnglet] = useState<"a_faire" | "livrees">("a_faire");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [idees, setIdees] = useState<Suggestion[]>([]);
  const [toutesIdees, setToutesIdees] = useState(false);
  // Répondre à une question (migration 020) : la réponse n'est visible que de la cliente
  const [brouillons, setBrouillons] = useState<Record<string, string>>({});
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [envoiReponse, setEnvoiReponse] = useState(false);

  useEffect(() => {
    api.adminGetCommandes()
      .then((d: { commandes: Commande[] }) => setCommandes(d?.commandes ?? []))
      .catch((err) => { if (err instanceof Error && /(403|interdit|Token)/i.test(err.message)) setAccesRefuse(true); })
      .finally(() => setChargement(false));
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

  const aFaire = useMemo(() => commandes.filter((c) => c.statut === "recue" || c.statut === "en_cours"), [commandes]);
  const livrees = useMemo(() => commandes.filter((c) => c.statut === "livree" || c.statut === "annulee").slice().reverse(), [commandes]);
  const visibles = onglet === "a_faire" ? aFaire : livrees;
  const cetteSemaine = commandes.filter((c) => c.type === "grand_tableau" && c.statut !== "annulee" && joursDepuis(c.creeLe) <= 7).length;

  async function maj(id: string, body: { statut?: Commande["statut"]; paye?: boolean; noteElena?: string }) {
    const d = await api.adminMajCommande(id, body).catch(() => null);
    if (!d?.commande) return;
    setCommandes((cs) => cs.map((c) => (c.id === id ? { ...c, ...d.commande } : c)));
  }

  if (accesRefuse) notFound();

  return (
    <CabinetShell>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">Commandes</h1>
          <p className="mt-1 text-sm text-mention">
            {aFaire.length} à faire · {livrees.length} livrée{livrees.length > 1 ? "s" : ""}
            {cetteSemaine > 0 && <> · <span className="font-semibold text-aubergine">{cetteSemaine} Grand Tableau cette semaine</span> (capacité : un)</>}
          </p>
        </div>
        <div className="flex gap-2">
          {([["a_faire", "À faire"], ["livrees", "Livrées"]] as const).map(([c, l]) => (
            <button key={c} type="button" onClick={() => setOnglet(c)} aria-pressed={onglet === c} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${onglet === c ? "bg-aubergine text-cream shadow-card" : "border border-greige/60 bg-ivory text-mention"}`}>{l}</button>
          ))}
        </div>
      </div>

      {chargement ? (
        <p className="mt-8 text-sm text-mention">Chargement…</p>
      ) : visibles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-10 text-center">
          <p className="text-3xl">✧</p>
          <p className="mt-2 text-sm text-mention">{onglet === "a_faire" ? "Aucune commande à faire." : "Aucune commande livrée pour l'instant."}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visibles.map((c) => {
            const st = STATUTS.find((s) => s.code === c.statut)!;
            return (
              <li key={c.id} className="rounded-2xl border border-greige/50 bg-ivory p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-jakarta text-lg font-bold text-aubergine">
                      {TYPES[c.type]} <span className="font-normal text-mention">· {c.montant} €</span>
                    </p>
                    <p className="mt-0.5 text-sm text-ink">
                      <a href={`/cabinet-ew/clientes/${c.clientId}`} className="font-medium text-prix hover:underline">{c.prenom} {c.nom}</a>
                      <span className="text-mention"> · commandé le {dateCourte(c.creeLe)}{c.livreLe ? ` · livré le ${dateCourte(c.livreLe)}` : joursDepuis(c.creeLe) >= 1 ? ` · il y a ${joursDepuis(c.creeLe)} j` : ""}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.teinte}`}>{st.label}</span>
                    <label className="flex items-center gap-1.5 text-xs text-ink">
                      <input type="checkbox" checked={c.paye} onChange={(e) => maj(c.id, { paye: e.target.checked })} /> réglé
                    </label>
                  </div>
                </div>
                {c.question && (
                  <p className="mt-3 rounded-xl bg-cream px-4 py-3 font-serif text-[15px] italic leading-relaxed text-ink">« {c.question} »</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {c.statut === "recue" && <button type="button" onClick={() => maj(c.id, { statut: "en_cours" })} className="rounded-full border border-greige bg-white px-3.5 py-1.5 text-xs font-semibold text-aubergine hover:border-gold">Je m&apos;y mets</button>}
                  {(c.statut === "recue" || c.statut === "en_cours") && <button type="button" onClick={() => maj(c.id, { statut: "livree" })} className="rounded-full bg-aubergine px-3.5 py-1.5 text-xs font-semibold text-cream hover:bg-aubergine/90">Livrée</button>}
                  {c.statut !== "annulee" && c.statut !== "livree" && <button type="button" onClick={() => maj(c.id, { statut: "annulee" })} className="rounded-full px-3 py-1.5 text-xs text-mention hover:underline">Annuler</button>}
                  {c.statut === "livree" && <button type="button" onClick={() => maj(c.id, { statut: "en_cours" })} className="rounded-full px-3 py-1.5 text-xs text-mention hover:underline">Rouvrir</button>}
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-mention">Ma note{c.noteElena ? " · " + c.noteElena.slice(0, 60) + (c.noteElena.length > 60 ? "…" : "") : ""}</summary>
                  <textarea
                    rows={2}
                    defaultValue={c.noteElena ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                    onBlur={() => { if (notes[c.id] !== undefined && notes[c.id] !== (c.noteElena ?? "")) maj(c.id, { noteElena: notes[c.id] }); }}
                    placeholder="Pour vous seule — ce que vous avez vu, ce qu'il reste à faire."
                    className="mt-2 w-full rounded-xl border border-greige/60 bg-white px-3 py-2 text-sm text-ink"
                  />
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Les idées de boosts, soufflées depuis le salon ── */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-jakarta text-2xl font-bold tracking-tight text-aubergine">Questions et idées</h2>
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
