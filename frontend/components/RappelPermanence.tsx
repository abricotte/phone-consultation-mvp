"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Une seule ligne sur la page d'arrivée du cabinet : « Permanence
// aujourd'hui : 16:00 – 19:00 » ou « Aucune permanence cette semaine → ».
// Le calendrier complet vit dans l'onglet Permanences (geste hebdomadaire) ;
// cette ligne évite seulement de découvrir un vendredi que la semaine est
// vide.

interface Creneau {
  id: string;
  debut: string;
  fin: string;
}

function jourISO(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function jourCourt(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    timeZone: "Europe/Paris",
  });
}

export default function RappelPermanence() {
  const [creneaux, setCreneaux] = useState<Creneau[] | null>(null);

  useEffect(() => {
    api
      .adminGetPermanences()
      .then((r: { creneaux: Creneau[] }) => setCreneaux(r.creneaux || []))
      // Table absente (migration non passée) ou erreur : on n'affiche
      // rien plutôt qu'une ligne d'erreur sur la page d'arrivée.
      .catch(() => setCreneaux(null));
  }, []);

  if (creneaux === null) return null;

  const aujourdhui = jourISO(new Date());
  const duJour = creneaux.filter((c) => jourISO(new Date(c.debut)) === aujourdhui);
  const aVenir = creneaux
    .filter((c) => new Date(c.fin).getTime() > Date.now())
    .sort((a, b) => a.debut.localeCompare(b.debut));

  let texte: React.ReactNode;
  if (duJour.length > 0) {
    texte = (
      <>
        Permanence aujourd&apos;hui :{" "}
        <span className="font-semibold text-aubergine tabular-nums">
          {duJour.map((c) => `${heure(c.debut)} – ${heure(c.fin)}`).join(" · ")}
        </span>
      </>
    );
  } else if (aVenir.length > 0) {
    texte = (
      <>
        Prochaine permanence :{" "}
        <span className="font-semibold text-aubergine tabular-nums">
          {jourCourt(aVenir[0].debut)} {heure(aVenir[0].debut)} – {heure(aVenir[0].fin)}
        </span>
      </>
    );
  } else {
    texte = <>Aucune permanence posée cette semaine</>;
  }

  return (
    <p className="mt-3 text-xs text-mention">
      ◷ {texte}{" · "}
      <a href="/cabinet-ew/permanences" className="text-prix hover:underline">
        gérer mes permanences →
      </a>
    </p>
  );
}
