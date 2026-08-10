"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";
import FilChronologique, {
  type EvenementFil,
} from "@/components/FilChronologique";
import { capitaliser, depuisQuand, comparerEcheances, echeanceProche } from "@/lib/format";
import {
  signeAstrologique,
  formatDateNaissance,
  signeParCode,
} from "@/lib/astro";

interface ProcheFiche {
  prenom: string;
  dateNaissance: string | null;
  ascendant: string | null;
  lien: string;
}

interface ConsultationFiche {
  id: string;
  date: string;
  formule: string;
  issue: string;
  dureeSecondes: number;
  montant: number;
}

interface RechargeFiche {
  date: string;
  montant: number;
  description: string;
}

interface Note {
  id: string;
  contenu: string;
  type?: "note" | "augure";
  aSuivre: boolean;
  echeance: string | null;
  /** Échéance en toutes lettres : « vers octobre » */
  echeanceTexte?: string | null;
  /** Augures : attente | confirme | pas_encore */
  statut?: string | null;
  closeLe: string | null;
  createdAt: string;
}

interface DateMarquante {
  id: string;
  libelle: string;
  date: string;
  recurrenceAnnuelle: boolean;
}

interface Rythme {
  intervalleMoyenJours: number | null;
  silenceJours: number | null;
  inhabituel: boolean;
}

interface Fiche {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  inscriteLe: string;
  dateNaissance: string | null;
  ascendant: string | null;
  solde: number;
  totalDepense: number;
  proches: ProcheFiche[];
  consultations: ConsultationFiche[];
  recharges: RechargeFiche[];
  notes: Note[];
  augures: Note[];
  datesMarquantes: DateMarquante[];
  rythme: Rythme;
}

const LIEN_LABELS: Record<string, string> = {
  compagnon: "Compagnon / compagne",
  ex: "Ex",
  mere: "Mère",
  pere: "Père",
  enfant: "Enfant",
  ami: "Ami(e)",
  autre: "Autre",
};

function formatDuree(s: number): string {
  if (!s || s <= 0) return "—";
  const min = Math.floor(s / 60);
  const sec = s % 60;
  if (min === 0) return `${sec} s`;
  return sec > 0 ? `${min} min ${sec.toString().padStart(2, "0")}` : `${min} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

// +33612345678 → 06 12 34 56 78
function formatTel(t: string | null): string {
  if (!t) return "—";
  const fr = t.replace(/^\+33/, "0");
  return /^0\d{9}$/.test(fr) ? fr.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : t;
}

export default function FicheClientePage() {
  const params = useParams<{ id: string }>();
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);

  // Carnet
  const [notes, setNotes] = useState<Note[]>([]);
  const [contenu, setContenu] = useState("");
  const [aSuivre, setASuivre] = useState(false);
  const [echeance, setEcheance] = useState("");
  const [enregistre, setEnregistre] = useState(false);
  const [noteErreur, setNoteErreur] = useState("");

  // Augures — ce que j'ai annoncé
  const [augures, setAugures] = useState<Note[]>([]);
  const [augureTexte, setAugureTexte] = useState("");
  const [augureQuand, setAugureQuand] = useState("");
  const [augureDate, setAugureDate] = useState("");
  const [augureEnCours, setAugureEnCours] = useState(false);

  // Dates qui pèsent
  const [dates, setDates] = useState<DateMarquante[]>([]);
  const [dateLibelle, setDateLibelle] = useState("");
  const [dateValeur, setDateValeur] = useState("");
  const [dateRecurrente, setDateRecurrente] = useState(true);
  const [dateEnCours, setDateEnCours] = useState(false);

  async function ajouterAugure(e: React.FormEvent) {
    e.preventDefault();
    if (!augureTexte.trim()) return;
    setAugureEnCours(true);
    try {
      const a = await api.adminAddAugure(params.id, {
        contenu: augureTexte.trim(),
        echeanceTexte: augureQuand.trim() || null,
        echeance: augureDate || null,
      });
      setAugures((p) => [a, ...p]);
      setAugureTexte("");
      setAugureQuand("");
      setAugureDate("");
    } catch {
      /* silencieux : le formulaire reste rempli */
    } finally {
      setAugureEnCours(false);
    }
  }

  async function majStatutAugure(a: Note, statut: string) {
    const avant = augures;
    setAugures((p) => p.map((x) => (x.id === a.id ? { ...x, statut } : x)));
    try {
      await api.adminMajAugure(a.id, statut);
    } catch {
      setAugures(avant);
    }
  }

  async function ajouterDate(e: React.FormEvent) {
    e.preventDefault();
    if (!dateLibelle.trim() || !dateValeur) return;
    setDateEnCours(true);
    try {
      const d = await api.adminAddDate(params.id, {
        libelle: dateLibelle.trim(),
        date: dateValeur,
        recurrenceAnnuelle: dateRecurrente,
      });
      setDates((p) => [...p, d].sort((x, y) => (x.date < y.date ? -1 : 1)));
      setDateLibelle("");
      setDateValeur("");
    } catch {
      /* silencieux */
    } finally {
      setDateEnCours(false);
    }
  }

  async function supprimerDate(id: string) {
    const avant = dates;
    setDates((p) => p.filter((d) => d.id !== id));
    try {
      await api.adminDeleteDate(id);
    } catch {
      setDates(avant);
    }
  }

  async function handleAjoutNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteErreur("");
    if (!contenu.trim()) return;
    setEnregistre(true);
    try {
      const note = await api.adminAddNote(params.id, {
        contenu: contenu.trim(),
        aSuivre,
        echeance: aSuivre && echeance ? echeance : null,
      });
      setNotes((prev) => [note, ...prev]);
      setContenu("");
      setASuivre(false);
      setEcheance("");
    } catch (err) {
      setNoteErreur(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setEnregistre(false);
    }
  }

  async function handleClore(note: Note) {
    const close = !note.closeLe;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? { ...n, closeLe: close ? new Date().toISOString() : null }
          : n
      )
    );
    try {
      await api.adminCloreNote(note.id, close);
    } catch {
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, closeLe: note.closeLe } : n))
      );
    }
  }

  async function handleSupprimeNote(id: string) {
    const sauvegarde = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.adminDeleteNote(id);
    } catch {
      setNotes(sauvegarde);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    api
      .adminGetCliente(params.id)
      .then((data: Fiche) => {
        setFiche(data);
        setNotes(data.notes || []);
        setAugures(data.augures || []);
        setDates(data.datesMarquantes || []);
      })
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse || !fiche) notFound();

  const signe = signeAstrologique(fiche.dateNaissance);
  const asc = signeParCode(fiche.ascendant);

  // Indicateurs de fidélité — calculés sur ses consultations facturées
  const facturees = fiche.consultations.filter(
    (c) => c.issue === "terminee" && c.montant > 0
  );
  const panierMoyen = facturees.length
    ? facturees.reduce((acc, c) => acc + c.montant, 0) / facturees.length
    : 0;
  const tenues = fiche.consultations.filter(
    (c) => c.issue === "terminee" || c.issue === "non_facturee"
  );
  const minutesTotales = Math.round(
    tenues.reduce((acc, c) => acc + c.dureeSecondes, 0) / 60
  );
  const dureeMoyenne = tenues.length ? Math.round(minutesTotales / tenues.length) : 0;
  // Sa première consultation (les plus récentes arrivent en premier)
  const premiere = tenues.length ? tenues[tenues.length - 1].date : null;

  // Fil unifié : tout ce qui s'est passé, mêlé par date
  const fil: EvenementFil[] = [
    ...fiche.consultations.map((c) => ({
      type: "consultation" as const,
      date: c.date,
      titre: c.formule,
      detail: formatDuree(c.dureeSecondes),
      montant: c.montant,
      nonFacturee: c.issue === "non_facturee",
    })),
    ...notes.map((n) => ({
      type: "note" as const,
      date: n.createdAt,
      titre: n.contenu,
    })),
    ...augures.map((a) => ({
      type: "augure" as const,
      date: a.createdAt,
      titre: a.contenu,
      detail:
        a.echeanceTexte ||
        (a.echeance ? `échéance ${formatDate(a.echeance)}` : null),
      statut: a.statut,
    })),
    ...fiche.recharges.map((r) => ({
      type: "recharge" as const,
      date: r.date,
      titre: r.description,
      montant: r.montant,
    })),
  ];

  return (
    <CabinetShell>
      <CabinetNav />

      <a
        href="/cabinet-ew/clientes"
        className="mt-8 inline-block text-sm font-medium text-prix transition-colors hover:text-cta"
      >
        ← Toutes les clientes
      </a>

      {/* Identité + ciel */}
      <section className="relative mt-4 overflow-hidden rounded-3xl border border-greige/60 bg-gradient-to-br from-blush via-cream to-cream p-7 shadow-soft">
        <span aria-hidden className="pointer-events-none absolute right-8 top-6 text-lg text-gold/50">✦</span>
        <span aria-hidden className="pointer-events-none absolute right-16 top-14 text-xs text-coral/40">✦</span>

        <div className="flex items-center gap-5">
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-4xl ring-1 ${
              signe
                ? "bg-gradient-to-br from-gold-light to-gold text-aubergine ring-gold-dark/30"
                : "bg-greige/40 text-mention ring-greige"
            }`}
          >
            {signe ? signe.emoji : fiche.prenom.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">
              {capitaliser(fiche.prenom)} {capitaliser(fiche.nom)}
            </h1>
            {signe ? (
              <p className="mt-0.5 text-sm text-ink">
                {signe.emoji} {signe.nom}
                {asc && ` · ascendant ${asc.nom}`}
                {fiche.dateNaissance &&
                  ` · née le ${formatDateNaissance(fiche.dateNaissance)}`}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-mention">
                Date de naissance non renseignée.
              </p>
            )}
            <p className="mt-1 text-xs text-mention">
              Cliente depuis le {formatDate(fiche.inscriteLe)}
            </p>
          </div>
        </div>

        {/* Contact + chiffres clés */}
        <div className="mt-5 grid gap-4 border-t border-greige/50 pt-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-mention">Téléphone : </span>
              {fiche.telephone ? (
                <a
                  href={`tel:${fiche.telephone}`}
                  className="font-medium text-prix hover:underline"
                >
                  {formatTel(fiche.telephone)}
                </a>
              ) : (
                <span className="text-mention">—</span>
              )}
            </p>
            <p className="truncate">
              <span className="text-mention">Email : </span>
              {fiche.email ? (
                <a
                  href={`mailto:${fiche.email}`}
                  className="font-medium text-prix hover:underline"
                >
                  {fiche.email}
                </a>
              ) : (
                <span className="text-mention">—</span>
              )}
            </p>
          </div>
          <div className="flex gap-6 sm:justify-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Crédit
              </p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                {euros(fiche.solde)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Total dépensé
              </p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-aubergine">
                {euros(fiche.totalDepense)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Indicateurs de fidélité — pour toi seule */}
      {tenues.length > 0 && (
        <section className="mt-5 rounded-3xl border border-greige/40 bg-ivory p-6 shadow-soft">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Panier moyen
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
                {euros(panierMoyen)}
              </p>
              <p className="text-xs text-mention">
                sur {facturees.length} consultation{facturees.length > 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Consultations
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
                {tenues.length}
              </p>
              <p className="text-xs text-mention">
                {premiere ? `depuis le ${formatDate(premiere)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Temps d&apos;écoute
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
                {minutesTotales}
                <span className="ml-1 text-base font-normal text-mention">min</span>
              </p>
              <p className="text-xs text-mention">{dureeMoyenne} min par appel</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mention">
                Recharges
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-aubergine">
                {fiche.recharges.length}
              </p>
              <p className="text-xs text-mention">
                {euros(
                  fiche.recharges.reduce((acc, r) => acc + r.montant, 0)
                )}{" "}
                au total
              </p>
            </div>
          </div>

          {/* SIGNAL DE SILENCE — information de lecture, jamais une
              relance : dans ce métier, un silence s'interprète.
              Un « rythme » n'a de sens qu'à partir de plusieurs appels ;
              en dessous, on dit simplement la dernière fois. */}
          {tenues.length > 0 && (
            <p
              className={`mt-5 rounded-xl px-4 py-2.5 text-sm ${
                fiche.rythme?.inhabituel
                  ? "bg-amber-50 text-amber-800"
                  : "bg-cream text-mention"
              }`}
            >
              {tenues.length >= 3 && fiche.rythme?.intervalleMoyenJours ? (
                <>
                  Elle appelle tous les{" "}
                  <strong className="font-semibold">
                    {fiche.rythme.intervalleMoyenJours} jours
                  </strong>{" "}
                  en moyenne ·{" "}
                  {fiche.rythme.silenceJours === 0 ? (
                    <strong className="font-semibold">vue aujourd&apos;hui</strong>
                  ) : (
                    <>
                      dernier appel{" "}
                      <strong className="font-semibold">
                        {depuisQuand(tenues[0].date)}
                      </strong>
                      {fiche.rythme.inhabituel && " — inhabituel pour elle"}
                    </>
                  )}
                </>
              ) : tenues.length === 1 ? (
                <>
                  Première consultation le{" "}
                  <strong className="font-semibold">
                    {formatDate(tenues[0].date)}
                  </strong>{" "}
                  · {depuisQuand(tenues[0].date)}
                </>
              ) : (
                <>
                  {tenues.length} consultations · dernière{" "}
                  <strong className="font-semibold">
                    {depuisQuand(tenues[0].date)}
                  </strong>
                </>
              )}
            </p>
          )}
        </section>
      )}

      {/* ===== CARNET PRIVÉ ===== */}
      <section className="mt-5 rounded-3xl border border-gold/40 bg-gradient-to-br from-blush/50 to-ivory p-7 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-jakarta text-xl font-bold tracking-tight text-aubergine">
            Mon carnet
          </h2>
          <p className="text-xs text-mention">
            🔒 Strictement privé — jamais visible par {capitaliser(fiche.prenom)}
          </p>
        </div>

        {/* Étiquettes rapides : un geste au lieu d'une phrase */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Amour", "Travail", "Famille", "Argent", "Santé", "Deuil"].map((e) => (
            <button
              key={e}
              type="button"
              onClick={() =>
                setContenu((c) => (c.includes(`${e} :`) ? c : `${e} : ${c}`))
              }
              className="rounded-full border border-greige/70 bg-ivory px-3 py-1 text-xs font-medium text-mention transition hover:border-cta/50 hover:text-aubergine"
            >
              {e}
            </button>
          ))}
        </div>

        <form onSubmit={handleAjoutNote} className="mt-3">
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            rows={3}
            placeholder={`Ce que vous voulez retenir de cette séance avec ${capitaliser(fiche.prenom)}…`}
            className="w-full rounded-2xl border border-greige bg-ivory px-4 py-3 text-ink focus:border-cta-outline focus:outline-none"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-aubergine">
              <input
                type="checkbox"
                checked={aSuivre}
                onChange={(e) => setASuivre(e.target.checked)}
                className="h-4 w-4 rounded border-greige accent-cta"
              />
              À suivre — remontera dans « À reprendre »
            </label>

            {aSuivre && (
              <label className="flex items-center gap-2 text-sm text-mention">
                Vers le
                <input
                  type="date"
                  value={echeance}
                  onChange={(e) => setEcheance(e.target.value)}
                  className="rounded-xl border border-greige bg-ivory px-3 py-1.5 text-ink focus:border-cta-outline focus:outline-none"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={enregistre || !contenu.trim()}
              className="ml-auto rounded-full bg-cta px-5 py-2 font-medium text-cta-text transition hover:bg-cta-dark disabled:opacity-40"
            >
              {enregistre ? "…" : "Noter"}
            </button>
          </div>

          {aSuivre && (
            <p className="mt-2 text-xs text-mention">
              Cette note apparaîtra dans votre zone « À reprendre » à
              l&apos;approche de l&apos;échéance. Pour une vraie prédiction,
              utilisez plutôt « Ce que je lui ai annoncé » ci-dessous.
            </p>
          )}

          {noteErreur && (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">
              {noteErreur}
            </p>
          )}
        </form>

        {notes.length > 0 && (
          <ul className="mt-5 space-y-2.5 border-t border-greige/50 pt-4">
            {notes.map((n) => (
              <li
                key={n.id}
                className={`group rounded-2xl border px-4 py-3 ${
                  n.aSuivre && !n.closeLe
                    ? "border-gold/50 bg-gold/5"
                    : "border-greige/50 bg-ivory"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`whitespace-pre-wrap text-sm ${
                        n.closeLe ? "text-mention line-through" : "text-ink"
                      }`}
                    >
                      {n.contenu}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mention">
                      {/* Relatif : « il y a 3 semaines » se lit plus vite
                          qu'une date quand on relit avant un appel */}
                      <span title={formatDate(n.createdAt)}>
                        {depuisQuand(n.createdAt)}
                      </span>
                      {n.aSuivre && (
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            n.closeLe
                              ? "bg-greige/40 text-mention"
                              : "bg-gold/20 text-gold-dark"
                          }`}
                        >
                          {n.closeLe
                            ? "✓ advenu"
                            : n.echeance
                            ? `à suivre · ${formatDate(n.echeance)}`
                            : "à suivre"}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                    {n.aSuivre && (
                      <button
                        onClick={() => handleClore(n)}
                        title={n.closeLe ? "Rouvrir" : "Marquer comme advenu"}
                        className="rounded-full px-2 py-1 text-xs text-mention hover:bg-blush hover:text-aubergine"
                      >
                        {n.closeLe ? "↺" : "✓"}
                      </button>
                    )}
                    <button
                      onClick={() => handleSupprimeNote(n.id)}
                      title="Supprimer"
                      className="rounded-full px-2 py-1 text-xs text-mention hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== LES AUGURES ===== */}
      <section className="mt-5 rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/[0.07] to-ivory p-7 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-jakarta text-xl font-bold tracking-tight text-aubergine">
            Ce que je lui ai annoncé
          </h2>
          <p className="text-xs text-mention">🔒 Pour ma mémoire seule</p>
        </div>

        <form onSubmit={ajouterAugure} className="mt-4">
          <textarea
            value={augureTexte}
            onChange={(e) => setAugureTexte(e.target.value)}
            rows={2}
            placeholder="Un changement professionnel, une nouvelle d'un homme parti…"
            className="w-full rounded-2xl border border-greige bg-ivory px-4 py-3 text-ink focus:border-cta-outline focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={augureQuand}
              onChange={(e) => setAugureQuand(e.target.value)}
              placeholder="vers octobre, avant la fin de l'année…"
              className="min-w-56 flex-1 rounded-xl border border-greige bg-ivory px-3 py-2 text-sm text-ink focus:border-cta-outline focus:outline-none"
            />
            <input
              type="date"
              value={augureDate}
              onChange={(e) => setAugureDate(e.target.value)}
              aria-label="Échéance précise (facultatif)"
              className="rounded-xl border border-greige bg-ivory px-3 py-2 text-sm text-ink focus:border-cta-outline focus:outline-none"
            />
            <button
              type="submit"
              disabled={augureEnCours || !augureTexte.trim()}
              className="ml-auto rounded-full bg-cta px-5 py-2 font-medium text-cta-text transition hover:bg-cta-dark disabled:opacity-40"
            >
              {augureEnCours ? "…" : "Poser l'augure"}
            </button>
          </div>
          <p className="mt-2 text-xs text-mention">
            L&apos;échéance peut rester floue — c&apos;est souvent plus juste
            qu&apos;une date. Les augures dont l&apos;heure vient remontent dans
            « À reprendre ».
          </p>
        </form>

        {augures.length > 0 && (
          <ul className="mt-5 space-y-3 border-t border-gold/30 pt-4">
            {/* Les augures en attente d'abord, échéance la plus proche en
                tête — celui de « vers octobre » passe devant celui de 2027 */}
            {[...augures]
              .sort((a, b) => {
                const ouvert = (x: Note) => (x.statut === "attente" ? 0 : 1);
                if (ouvert(a) !== ouvert(b)) return ouvert(a) - ouvert(b);
                return comparerEcheances(a, b);
              })
              .map((a) => {
                const enAttente = a.statut === "attente";
                const urgent = enAttente && echeanceProche(a.echeance);
                return (
                  <li
                    key={a.id}
                    className={`rounded-2xl border-l-4 border-y border-r px-4 py-3 ${
                      urgent
                        ? "border-l-cta border-y-gold/40 border-r-gold/40 bg-gold/[0.08]"
                        : enAttente
                        ? "border-l-gold border-y-gold/30 border-r-gold/30 bg-gold/[0.04]"
                        : "border-l-greige border-y-greige/50 border-r-greige/50 bg-ivory"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0 flex-1">
                        {/* La prédiction en premier, en grand : c'est elle
                            qu'on relit. L'échéance juste dessous. */}
                        <p
                          className={`text-[15px] leading-snug ${
                            enAttente ? "font-medium text-ink" : "text-mention"
                          }`}
                        >
                          {a.contenu}
                        </p>
                        <p className="mt-1 text-xs text-mention">
                          {a.echeanceTexte ||
                            (a.echeance ? formatDate(a.echeance) : "sans échéance")}
                          {urgent && (
                            <span className="ml-2 font-semibold text-prix">
                              · l&apos;heure approche
                            </span>
                          )}
                          {a.closeLe && a.statut === "confirme" && (
                            <span className="ml-2 text-statut-online">
                              · advenu le {formatDate(a.closeLe)}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Vrais boutons : bordure, fond, état actif net */}
                      <div
                        role="group"
                        aria-label="Statut de l'augure"
                        className="flex shrink-0 overflow-hidden rounded-full border border-greige/70"
                      >
                        {(
                          [
                            ["attente", "En attente", "bg-amber-100 text-amber-800"],
                            ["confirme", "✓ Advenu", "bg-[#3B6D11] text-white"],
                            ["pas_encore", "Pas encore", "bg-greige text-ink"],
                          ] as const
                        ).map(([code, label, actifClasses]) => (
                          <button
                            key={code}
                            onClick={() => majStatutAugure(a, code)}
                            aria-pressed={a.statut === code}
                            className={`px-3 py-1.5 text-xs font-semibold transition ${
                              a.statut === code
                                ? actifClasses
                                : "bg-ivory text-mention hover:bg-blush"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* ===== DATES QUI PÈSENT ===== */}
      <section className="mt-5 rounded-3xl border border-greige/40 bg-ivory p-7 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-jakarta text-xl font-bold tracking-tight text-aubergine">
            Dates qui pèsent
          </h2>
          <p className="text-xs text-mention">
            Ce qu&apos;elle m&apos;a confié et qu&apos;il serait dur d&apos;oublier
          </p>
        </div>

        {dates.length > 0 && (
          <ul className="mt-4 space-y-2">
            {dates.map((d) => (
              <li
                key={d.id}
                className="group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-greige/50 bg-cream px-4 py-2.5"
              >
                <span className="font-medium text-ink">{d.libelle}</span>
                <span className="text-xs text-mention">
                  {formatDate(d.date)}
                  {d.recurrenceAnnuelle && " · chaque année"}
                </span>
                <button
                  onClick={() => supprimerDate(d.id)}
                  aria-label={`Supprimer ${d.libelle}`}
                  className="ml-auto rounded-full px-2 py-1 text-xs text-mention opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={ajouterDate} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={dateLibelle}
            onChange={(e) => setDateLibelle(e.target.value)}
            placeholder="Séparation, deuil, procès…"
            className="min-w-48 flex-1 rounded-xl border border-greige bg-ivory px-3 py-2 text-sm text-ink focus:border-cta-outline focus:outline-none"
          />
          <input
            type="date"
            value={dateValeur}
            onChange={(e) => setDateValeur(e.target.value)}
            aria-label="Date"
            className="rounded-xl border border-greige bg-ivory px-3 py-2 text-sm text-ink focus:border-cta-outline focus:outline-none"
          />
          <label className="flex items-center gap-1.5 text-xs text-mention">
            <input
              type="checkbox"
              checked={dateRecurrente}
              onChange={(e) => setDateRecurrente(e.target.checked)}
              className="h-4 w-4 rounded border-greige accent-cta"
            />
            chaque année
          </label>
          <button
            type="submit"
            disabled={dateEnCours || !dateLibelle.trim() || !dateValeur}
            className="rounded-full border border-cta-outline px-4 py-2 text-sm font-medium text-prix transition hover:bg-cta hover:text-cta-text disabled:opacity-40"
          >
            Ajouter
          </button>
        </form>
      </section>

      {/* Les personnes qui comptent */}
      <section className="mt-5 rounded-3xl border border-greige/40 bg-ivory p-7 shadow-soft">
        <h2 className="font-jakarta text-xl font-bold tracking-tight text-aubergine">
          Les personnes qui comptent
        </h2>
        {fiche.proches.length === 0 ? (
          <p className="mt-3 text-sm text-mention">
            Aucun proche renseigné pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {fiche.proches.map((p, i) => {
              const s = signeAstrologique(p.dateNaissance);
              const a = signeParCode(p.ascendant);
              return (
                <li
                  key={i}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl border border-greige/50 bg-cream px-4 py-2.5"
                >
                  <span className="font-medium text-ink">{p.prenom}</span>
                  <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs text-mention">
                    {LIEN_LABELS[p.lien] || "Autre"}
                  </span>
                  <span className="text-xs text-mention">
                    {[
                      p.dateNaissance ? formatDateNaissance(p.dateNaissance) : null,
                      s ? `${s.emoji} ${s.nom}` : null,
                      a ? `asc. ${a.nom}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Fil chronologique unifié — l'histoire d'une personne d'un
          seul regard, plutôt que quatre blocs à recoller */}
      <section className="mt-5 rounded-3xl border border-greige/40 bg-ivory p-7 shadow-soft">
        <h2 className="font-jakarta text-xl font-bold tracking-tight text-aubergine">
          Son histoire
        </h2>
        <p className="mt-0.5 text-sm text-mention">
          Consultations, notes, augures et recharges, mêlés par date.
        </p>
        <div className="mt-5">
          <FilChronologique evenements={fil} />
        </div>
      </section>
    </CabinetShell>
  );
}
