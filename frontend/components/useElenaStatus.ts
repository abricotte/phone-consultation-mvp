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
  /** Message d'absence, seulement pendant sa période de validité */
  messageAbsence: string | null;
  /** Écriteaux de permanence — « le calendrier annonce, le bouton fait foi » */
  permanence: {
    enCours: { debut: string; fin: string } | null;
    prochaine: { debut: string; fin: string } | null;
    /** Les 3 prochains créneaux — pour l'encadré de l'accueil */
    prochaines: { debut: string; fin: string }[];
    actives: boolean;
  };
}

const AUCUNE_PERMANENCE = { enCours: null, prochaine: null, prochaines: [], actives: false };

const INITIAL: ElenaPresence = {
  statut: "chargement",
  retourPrevu: null,
  heuresIndicatives: null,
  messageAbsence: null,
  permanence: AUCUNE_PERMANENCE,
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
          messageAbsence: r.messageAbsence ?? null,
          permanence: {
            ...AUCUNE_PERMANENCE,
            ...(r.permanence ?? {}),
            prochaines: r.permanence?.prochaines ?? [],
          },
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

/** « 16:00 » en heure de Paris */
export function heureParis(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

/** « mardi 16:00 – 19:00 » — ou « aujourd'hui 16:00 – 19:00 » */
export function libellePermanence(c: { debut: string; fin: string }): string {
  const jourISO = (d: Date) =>
    d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  const debut = new Date(c.debut);
  const aujourdhui = jourISO(new Date()) === jourISO(debut);
  const demain =
    jourISO(new Date(Date.now() + 86_400_000)) === jourISO(debut);
  const jour = aujourdhui
    ? "aujourd'hui"
    : demain
      ? "demain"
      : debut.toLocaleDateString("fr-FR", {
          weekday: "long",
          timeZone: "Europe/Paris",
        });
  return `${jour} ${heureParis(c.debut)} – ${heureParis(c.fin)}`;
}

/** « mar. 16:00 – 19:00 » — pastille compacte de l'encadré */
export function libelleCourtPermanence(c: { debut: string; fin: string }): string {
  const jour = new Date(c.debut).toLocaleDateString("fr-FR", {
    weekday: "short",
    timeZone: "Europe/Paris",
  });
  return `${jour} ${heureParis(c.debut)} – ${heureParis(c.fin)}`;
}

/** « dans 1 j 4 h », « dans 3 h », « dans 40 min » */
export function dansCombien(iso: string): string {
  const min = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000));
  if (min < 60) return `dans ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `dans ${h} h`;
  const j = Math.floor(h / 24);
  const reste = h % 24;
  return `dans ${j} j${reste > 0 ? ` ${reste} h` : ""}`;
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
