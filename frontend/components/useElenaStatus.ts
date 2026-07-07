"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Machine à états praticienne (source : praticiennes.statut)
export type ElenaStatus =
  | "disponible"
  | "en_consultation"
  | "hors_ligne"
  | "chargement";

// Statut d'Elena, rafraîchi par polling toutes les 30 s.
export function useElenaStatus(pollMs = 30_000): ElenaStatus {
  const [status, setStatus] = useState<ElenaStatus>("chargement");

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const { statut, enLigne } = await api.getStatut();
        if (!active) return;
        if (statut) {
          setStatus(statut as ElenaStatus);
        } else {
          // Backend pas encore migré : retomber sur le booléen
          setStatus(enLigne ? "disponible" : "hors_ligne");
        }
      } catch {
        if (active) setStatus("hors_ligne");
      }
    }

    check();
    const id = setInterval(check, pollMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return status;
}
