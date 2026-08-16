"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";
import PermanencesSemaine from "@/components/PermanencesSemaine";

// PERMANENCES — un onglet à part entière.
//
// La règle qui a tranché (Elena) : « la page d'arrivée sert ce que je
// fais tous les jours, un onglet sert ce que je fais toutes les
// semaines. » Le calendrier occupait la moitié du Cabinet pour un geste
// hebdomadaire, pendant que « À rattraper » — consulté plusieurs fois
// par jour — se noyait au milieu. Il a sa page ; le Cabinet garde une
// seule ligne de rappel.

export default function PermanencesPage() {
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    // Même garde que les autres pages du cabinet : une cliente qui
    // devine l'adresse tombe sur une 404, pas sur l'agenda d'Elena.
    api
      .adminGetStatut()
      .then(() => setPret(true))
      .catch(() => setAccesRefuse(true));
  }, []);

  if (accesRefuse) notFound();

  return (
    <CabinetShell>
      <CabinetNav />

      <div className="mt-6">
        <h1 className="font-jakarta text-3xl font-bold tracking-tight text-aubergine">
          Mes permanences
        </h1>
        <p className="mt-1 text-sm text-mention">
          Les créneaux que vos clientes voient sur le site et dans leur
          espace. Poser une permanence n&apos;ouvre jamais les appels — seul
          le bouton « Passer en ligne » le fait.
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-greige/60 bg-ivory p-6 shadow-soft">
        {pret ? (
          <PermanencesSemaine />
        ) : (
          <p className="text-sm text-mention">Chargement…</p>
        )}
      </div>
    </CabinetShell>
  );
}
