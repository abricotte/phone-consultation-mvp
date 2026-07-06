"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type ElenaStatus = "online" | "offline" | "loading";

// Statut en ligne d'Elena — piloté par le toggle admin
// (praticiennes.statut_en_ligne, auto-off appliqué côté backend),
// rafraîchi par polling toutes les 30 s.
// Fallback transitoire : disponibilité des consultants tant que le
// backend déployé n'expose pas encore /config/statut.
export function useElenaStatus(pollMs = 30_000): ElenaStatus {
  const [status, setStatus] = useState<ElenaStatus>("loading");

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const { enLigne } = await api.getStatut();
        if (!active) return;
        setStatus(enLigne ? "online" : "offline");
      } catch {
        try {
          const consultants: { isAvailable: boolean }[] =
            await api.getConsultants();
          if (!active) return;
          setStatus(
            consultants.some((c) => c.isAvailable) ? "online" : "offline"
          );
        } catch {
          if (active) setStatus("offline");
        }
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
