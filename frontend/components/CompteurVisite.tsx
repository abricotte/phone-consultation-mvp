"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

// Compteur de fréquentation ANONYME.
//
// Ce composant n'envoie JAMAIS d'identifiant : uniquement « une visite,
// avec ou sans crédit, sur telle page ». C'est le navigateur qui assure
// la déduplication — il retient localement le créneau déjà compté et
// n'envoie pas de second signal. Le serveur ne peut donc pas savoir qui
// revient, ni combien de personnes distinctes se cachent derrière un
// compteur : c'est le prix, assumé, d'une statistique réellement anonyme.
//
// Aucun cookie : une simple clé localStorage, purement locale.
const CLE = "creneauVisiteCompte";

export default function CompteurVisite({
  page,
}: {
  page: "accueil" | "consultation-minute";
}) {
  useEffect(() => {
    // Un créneau = une page, un jour, une heure
    const d = new Date();
    const creneau = `${page}-${d.toISOString().slice(0, 10)}-${d.getHours()}`;

    try {
      if (localStorage.getItem(CLE) === creneau) return; // déjà compté
      localStorage.setItem(CLE, creneau);
    } catch {
      // Stockage indisponible (navigation privée stricte) : on s'abstient
      // plutôt que de risquer de compter à chaque rechargement.
      return;
    }

    // « Avec crédit » se déduit du solde, sans transmettre qui que ce soit
    const token = localStorage.getItem("token");
    if (!token) {
      api.enregistrerVisite({ page, avecCredit: false }).catch(() => {});
      return;
    }

    api
      .getWallet()
      .then((w: { balance?: number }) =>
        api.enregistrerVisite({ page, avecCredit: (w?.balance ?? 0) > 0 })
      )
      .catch(() => api.enregistrerVisite({ page, avecCredit: false }).catch(() => {}));
  }, [page]);

  return null;
}
