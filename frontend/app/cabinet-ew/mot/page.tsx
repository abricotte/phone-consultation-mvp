"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";

// LE MOT D'ELENA — un onglet à part entière (décision d'Elena).
//
// C'est sa parole vers toutes ses clientes, pas un réglage parmi
// d'autres. Un message court sous leur bonjour, un seul à la fois : le
// nouveau remplace l'ancien, retirer rend la citation du jour. Jamais
// de notification, jamais d'envoi — c'est l'espace qui change quand la
// cliente vient, pas un message qui la poursuit.

interface MotActif {
  texte: string;
  quand: string | null;
}

export default function MotElenaPage() {
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [texte, setTexte] = useState("");
  const [actif, setActif] = useState<MotActif | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    api
      .adminGetMotElena()
      .then((r: { actif: MotActif | null }) => setActif(r.actif))
      .catch((e) => {
        // Rôle refusé → 404 comme les autres pages ; table absente →
        // on l'affiche, la migration 013 est peut-être à passer.
        if (e instanceof Error && /migration/i.test(e.message)) setErreur(e.message);
        else setAccesRefuse(true);
      });
  }, []);

  if (accesRefuse) notFound();

  async function publier(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setMessage("");
    setErreur("");
    try {
      // Publier avec un champ vide = retirer (le serveur le sait aussi)
      const r = await api.adminPublierMotElena(texte);
      setActif(r.actif);
      setMessage(r.message);
      if (r.actif) setTexte("");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  async function retirer() {
    setEnCours(true);
    setMessage("");
    setErreur("");
    try {
      const r = await api.adminRetirerMotElena();
      setActif(null);
      setMessage(r.message);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <CabinetShell>
      <CabinetNav />

      <div className="mt-6">
        <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">
          Le mot d&apos;Elena
        </h1>
        <p className="mt-1 text-sm text-mention">
          Affiché sur l&apos;espace de toutes vos clientes, sous leur bonjour.
          Un seul mot à la fois — le nouveau remplace l&apos;ancien.
        </p>
      </div>

      {/* Ce que les clientes voient EN CE MOMENT — en tête, c'est ce
          qu'Elena vient vérifier avant d'écrire. */}
      <div className="mt-6">
        {actif ? (
          <div className="relative rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 to-cream px-6 pb-5 pt-6 shadow-soft">
            <span
              aria-hidden
              className="absolute -top-3 left-6 rounded-full bg-cream px-2 text-base text-gold"
            >
              ✦
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-gold-dark">
              Affiché en ce moment{actif.quand ? ` · depuis ${actif.quand}` : ""}
            </p>
            <p className="mt-2 font-serif text-xl italic leading-relaxed text-aubergine">
              « {actif.texte} »
            </p>
            <button
              type="button"
              onClick={retirer}
              disabled={enCours}
              className="mt-4 text-sm text-mention underline decoration-greige underline-offset-4 transition hover:text-red-600 disabled:opacity-50"
            >
              Retirer le mot — vos clientes reverront la citation du jour
            </button>
          </div>
        ) : (
          <p className="rounded-3xl border border-greige/50 bg-greige/15 px-6 py-5 text-sm text-mention">
            — Aucun mot affiché en ce moment — vos clientes voient la citation
            du jour.
          </p>
        )}
      </div>

      {/* Écrire */}
      <form
        onSubmit={publier}
        className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft"
      >
        <label className="block">
          <span className="font-jakarta text-lg font-bold text-aubergine">
            {actif ? "Écrire un nouveau mot" : "Écrire un mot"}
          </span>
          <textarea
            rows={4}
            maxLength={200}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Cette semaine, on tient la route."
            className="mt-3 w-full rounded-2xl border border-greige/60 bg-white px-4 py-3 font-serif text-xl italic leading-relaxed text-aubergine placeholder:text-mention/50 focus:border-gold focus:outline-none"
          />
        </label>
        <p className="mt-1 text-right text-xs tabular-nums text-mention">
          {texte.length} / 200
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={enCours || !texte.trim()}
            className="rounded-full bg-cta px-6 py-3 text-sm font-bold text-cta-text shadow-card transition hover:bg-cta-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {enCours ? "Publication…" : "Afficher chez mes clientes"}
          </button>
          <span className="text-xs text-mention">
            Aucune notification, aucun envoi : elles le liront en venant.
          </span>
        </div>

        {message && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>
        )}
        {erreur && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{erreur}</p>
        )}
      </form>
    </CabinetShell>
  );
}
