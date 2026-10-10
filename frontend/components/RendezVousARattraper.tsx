"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { signeAstrologique } from "@/lib/astro";

// À RATTRAPER — dans l'onglet Calendly, sous « Ma journée ».
//
// Un rendez-vous dont l'heure est passée sans qu'un appel ait été lancé
// depuis l'espace reste ici. Règle inchangée : RIEN ne disparaît sans
// qu'Elena l'ait décidé. Ce qui change (10 octobre) : elle peut décider.
// Un rendez-vous qu'elle a assuré depuis son propre téléphone se marque
// « fait » et quitte la liste — avant, il y restait pour toujours, et
// vingt-cinq lignes serrées écrasaient la page.
//
// Mise en page : un jour = un groupe, une ligne = une personne, les
// gestes à droite. Le motif se lit sur une ligne, s'ouvre d'un clic.
// Les plus anciens se replient : on rattrape d'abord ce qui est proche.

export interface RendezVousRattrapable {
  id: string;
  client_id: string | null;
  telephone: string | null;
  prenom: string;
  forfait_code: string | null;
  formule: string | null;
  debut: string;
  tentatives: number;
  aAborder: string | null;
  dateNaissance: string | null;
}

const PARIS = { timeZone: "Europe/Paris" } as const;
/** Combien de jours s'ouvrent d'emblée ; le reste se replie */
const JOURS_VISIBLES = 3;

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", ...PARIS });
const jourISO = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", PARIS);
function jourLong(iso: string): string {
  const d = new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", ...PARIS });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export default function RendezVousARattraper({
  initial,
}: {
  /** Aperçu uniquement : des rendez-vous factices, sans appel serveur */
  initial?: RendezVousRattrapable[];
} = {}) {
  const [liste, setListe] = useState<RendezVousRattrapable[]>(initial ?? []);
  const [charge, setCharge] = useState(!!initial);
  const [toutVoir, setToutVoir] = useState(false);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<{ texte: string; annuler?: () => void } | null>(null);
  const [erreur, setErreur] = useState("");

  function recharger() {
    if (initial) return;
    api
      .adminGetRendezVous()
      .then((r: { duJour: (RendezVousRattrapable & { statut: string; aRattraper: boolean })[]; enRetard: RendezVousRattrapable[] }) => {
        setListe([
          ...(r.duJour || []).filter((x) => x.statut === "prevu" && x.aRattraper),
          ...(r.enRetard || []),
        ]);
      })
      .catch(() => setListe([]))
      .finally(() => setCharge(true));
  }

  useEffect(() => {
    recharger();
    const id = setInterval(recharger, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function marquer(r: RendezVousRattrapable, statut: "honore" | "annule") {
    setEnCours(r.id);
    setErreur("");
    try {
      if (!initial) await api.adminMajRendezVous(r.id, statut);
      setListe((l) => l.filter((x) => x.id !== r.id));
      setMessage({
        texte: `${r.prenom} — rendez-vous ${statut === "honore" ? "marqué fait" : "annulé"}.`,
        // Le retour arrière est le filet : décider vite, sans crainte.
        annuler: async () => {
          if (!initial) await api.adminMajRendezVous(r.id, "prevu");
          setListe((l) => [...l, r].sort((a, b) => b.debut.localeCompare(a.debut)));
          setMessage(null);
        },
      });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(null);
    }
  }

  async function toutSolder() {
    if (!window.confirm(`Marquer ces ${liste.length} rendez-vous passés comme faits ? Ils quitteront la liste.`)) return;
    setEnCours("tout");
    setErreur("");
    try {
      if (!initial) await api.adminSolderRendezVous();
      setListe([]);
      setMessage({ texte: "Tous les rendez-vous passés sont marqués faits." });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(null);
    }
  }

  async function lancer(r: RendezVousRattrapable) {
    if (!r.telephone) {
      setErreur(`${r.prenom} n'a pas laissé de numéro — appelez-la depuis sa fiche.`);
      return;
    }
    setEnCours(r.id);
    setErreur("");
    try {
      if (!initial) {
        const res = await api.adminLancerForfait({
          telephone: r.telephone,
          forfaitCode: r.forfait_code,
          rendezVousId: r.id,
        });
        setMessage({ texte: res?.message || "Appel lancé." });
        recharger();
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(null);
    }
  }

  if (!charge) return null;
  if (liste.length === 0 && !message) return null;

  // Un jour = un groupe, du plus récent au plus ancien
  const tri = [...liste].sort((a, b) => b.debut.localeCompare(a.debut));
  const jours: { jour: string; lignes: RendezVousRattrapable[] }[] = [];
  for (const r of tri) {
    const j = jourISO(r.debut);
    const dernier = jours[jours.length - 1];
    if (dernier && dernier.jour === j) dernier.lignes.push(r);
    else jours.push({ jour: j, lignes: [r] });
  }
  const visibles = toutVoir ? jours : jours.slice(0, JOURS_VISIBLES);
  const caches = jours.slice(JOURS_VISIBLES).reduce((n, j) => n + j.lignes.length, 0);

  return (
    <section className="mt-4 rounded-3xl border border-gold/30 bg-ivory p-6 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-jakarta text-lg font-bold text-aubergine">
          À rattraper
          {liste.length > 0 && (
            <span className="ml-2 rounded-full bg-gold/15 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-gold-dark">
              {liste.length}
            </span>
          )}
        </h2>
        {liste.length > 1 && (
          <button
            type="button"
            onClick={toutSolder}
            disabled={enCours !== null}
            className="text-xs text-mention underline decoration-greige underline-offset-4 transition hover:text-aubergine disabled:opacity-40"
          >
            Tout marquer comme fait
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-mention">
        Rendez-vous passés sans appel lancé depuis l&apos;espace. Si vous l&apos;avez
        assuré depuis votre téléphone, marquez-le fait : il quitte la liste.
      </p>

      {message && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {message.texte}
          {message.annuler && (
            <>
              {" "}
              <button type="button" onClick={message.annuler} className="font-semibold underline underline-offset-2">
                annuler
              </button>
            </>
          )}
        </p>
      )}
      {erreur && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

      {visibles.map((g) => (
        <div key={g.jour} className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
            {jourLong(g.lignes[0].debut)}
          </p>
          <ul className="mt-2 divide-y divide-greige/40 rounded-2xl border border-greige/50 bg-cream/40">
            {g.lignes.map((r) => {
              const signe = signeAstrologique(r.dateNaissance);
              const estOuvert = ouvert === r.id;
              return (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="w-12 shrink-0 text-sm tabular-nums text-mention">{heure(r.debut)}</span>
                    {r.client_id ? (
                      <a href={`/cabinet-ew/clientes/${r.client_id}`} className="font-semibold text-aubergine hover:underline">
                        {r.prenom}
                      </a>
                    ) : (
                      <span className="font-semibold text-aubergine">{r.prenom}</span>
                    )}
                    {signe && (
                      <span className="rounded-full bg-blush px-2 py-0.5 text-xs text-ink/80">
                        {signe.nom}
                      </span>
                    )}
                    {r.tentatives > 0 && (
                      <span className="text-xs text-red-600">
                        {r.tentatives} tentative{r.tentatives > 1 ? "s" : ""}
                      </span>
                    )}

                    {/* Les gestes, à droite : « Fait » est le plus fréquent
                        pour un rendez-vous assuré par téléphone ; l'appel
                        reste là pour celui qui ne l'a pas été. */}
                    <span className="ml-auto flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => marquer(r, "honore")}
                        disabled={enCours !== null}
                        className="rounded-full border border-greige px-3 py-1 text-xs font-medium text-ink transition hover:border-aubergine hover:text-aubergine disabled:opacity-40"
                      >
                        Fait
                      </button>
                      <button
                        type="button"
                        onClick={() => lancer(r)}
                        disabled={enCours !== null}
                        className="rounded-full bg-cta px-3 py-1 text-xs font-semibold text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-40"
                      >
                        {enCours === r.id ? "appel…" : "Lancer l'appel"}
                      </button>
                    </span>
                  </div>

                  {/* Le motif : une ligne, le reste d'un clic — à rattraper
                      se prépare comme le prochain, Elena doit savoir ce
                      qu'on vient chercher. */}
                  {r.aAborder && (
                    <button
                      type="button"
                      onClick={() => setOuvert(estOuvert ? null : r.id)}
                      className={`mt-1.5 block w-full pl-[3.75rem] text-left text-xs italic text-ink/75 ${
                        estOuvert ? "" : "truncate"
                      }`}
                      title={estOuvert ? "Replier" : "Lire en entier"}
                    >
                      « {r.aAborder} »
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {caches > 0 && !toutVoir && (
        <button
          type="button"
          onClick={() => setToutVoir(true)}
          className="mt-4 text-sm text-prix hover:underline"
        >
          Voir les {caches} plus anciens →
        </button>
      )}
    </section>
  );
}
