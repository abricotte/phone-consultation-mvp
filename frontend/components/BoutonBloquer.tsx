"use client";

import { useState } from "react";
import { api } from "@/lib/api";

// Bouton « Bloquer ce numéro » — utilisé dans la fiche cliente et dans le
// journal, pour que le geste soit identique aux deux endroits.
//
// Deux partis pris :
//  — Une confirmation est demandée, avec un motif facultatif. Bloquer se
//    fait souvent sous le coup de l'agacement ; une seconde de pause et un
//    mot écrit aident à s'en souvenir dans six mois.
//  — Le motif est pour SA mémoire. Il n'est montré à personne d'autre, et
//    la personne bloquée n'apprend jamais qu'elle l'est.

export default function BoutonBloquer({
  telephone,
  nom,
  bloqueId,
  onChange,
  discret = false,
}: {
  telephone: string | null;
  /** Prénom ou libellé, pour que la confirmation soit sans ambiguïté */
  nom?: string;
  /** Identifiant du blocage existant, si ce numéro est déjà bloqué */
  bloqueId?: string | null;
  onChange?: () => void;
  /** Rendu discret pour une ligne de journal */
  discret?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  if (!telephone) return null;

  async function bloquer() {
    setEnCours(true);
    setErreur("");
    try {
      await api.adminBloquerNumero(telephone!, motif);
      setOuvert(false);
      setMotif("");
      onChange?.();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  async function debloquer() {
    if (!bloqueId) return;
    setEnCours(true);
    setErreur("");
    try {
      await api.adminDebloquerNumero(bloqueId);
      onChange?.();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  if (bloqueId) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
          Numéro bloqué
        </span>
        <button
          type="button"
          onClick={debloquer}
          disabled={enCours}
          className="text-xs text-mention underline transition hover:text-aubergine"
        >
          {enCours ? "…" : "Débloquer"}
        </button>
        {erreur && <span className="text-xs text-red-600">{erreur}</span>}
      </span>
    );
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={
          discret
            ? "text-xs text-mention transition hover:text-red-600"
            : "rounded-full border border-greige/60 bg-white px-4 py-2 text-sm font-medium text-mention transition hover:border-red-300 hover:text-red-600"
        }
      >
        Bloquer ce numéro
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
      <p className="text-sm font-medium text-ink">
        Bloquer {nom ? <strong>{nom}</strong> : "ce numéro"} ?
      </p>
      <p className="mt-1 text-xs leading-relaxed text-mention">
        Cette personne ne pourra plus lancer de consultation, et ses appels
        seront raccrochés sans vous sonner. Elle n'en sera pas informée. Vous
        pouvez débloquer à tout moment.
      </p>
      <input
        type="text"
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        placeholder="Motif (facultatif, pour vous seule)"
        className="mt-3 w-full rounded-xl border border-greige/60 bg-white px-3 py-2 text-sm text-ink placeholder:text-mention/70"
      />
      {erreur && <p className="mt-2 text-xs text-red-600">{erreur}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setOuvert(false);
            setErreur("");
          }}
          className="rounded-full border border-greige/60 bg-white px-4 py-2 text-sm text-mention transition hover:text-aubergine"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={bloquer}
          disabled={enCours}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {enCours ? "Blocage…" : "Bloquer"}
        </button>
      </div>
    </div>
  );
}
