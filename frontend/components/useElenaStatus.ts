"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Machine à états praticienne (source : praticiennes.statut)
export type ElenaStatus =
  | "disponible"
  | "en_consultation"
  | "hors_ligne"
  | "chargement";

export interface ElenaPresence {
  statut: ElenaStatus;
  /** Heure de fin maximale de la consultation en cours, sinon null */
  retourPrevu: string | null;
  /** « Je suis généralement en ligne en soirée » — réglé dans le profil */
  heuresIndicatives: string | null;
}

const INITIAL: ElenaPresence = {
  statut: "chargement",
  retourPrevu: null,
  heuresIndicatives: null,
};

// Présence d'Elena, rafraîchie par polling toutes les 30 s.
//
// « De retour vers 15 h » est la différence entre une porte close et une
// porte qui dit quand elle rouvre : c'est cette information qui déclenche
// le bon appel au bon moment.
export function useElenaPresence(pollMs = 30_000): ElenaPresence {
  const [presence, setPresence] = useState<ElenaPresence>(INITIAL);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const r = await api.getStatut();
        if (!active) return;
        const statut: ElenaStatus =
          r.statut ?? (r.enLigne ? "disponible" : "hors_ligne");
        setPresence({
          statut,
          retourPrevu: r.retourPrevu ?? null,
          heuresIndicatives: r.heuresIndicatives ?? null,
        });
      } catch {
        if (active) setPresence({ ...INITIAL, statut: "hors_ligne" });
      }
    }

    check();
    const id = setInterval(check, pollMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return presence;
}

// Compatibilité : les composants qui ne veulent que le statut.
export function useElenaStatus(pollMs = 30_000): ElenaStatus {
  return useElenaPresence(pollMs).statut;
}

/** « 15 h 05 » — ou null si l'heure est invalide ou déjà passée */
export function heureRetour(retourPrevu: string | null): string | null {
  if (!retourPrevu) return null;
  const d = new Date(retourPrevu);
  if (Number.isNaN(d.getTime()) || d.getTime() < Date.now()) return null;
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}
