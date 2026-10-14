"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceShell from "@/components/EspaceShell";
import ThemeAstralVue, { type ProfilTheme } from "@/components/ThemeAstralVue";

// VOTRE THÈME ASTRAL — la page : elle lit le profil (date, heure, lieu,
// coordonnées, fuseau — migration 017) et confie le reste à la vue. Le
// calcul se fait dans le navigateur : rien n'est stocké en base.

export default function ThemeAstralPage() {
  const [profil, setProfil] = useState<ProfilTheme | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.getProfil().then((d: ProfilTheme) => setProfil(d)).catch(() => setErreur("Impossible de lire votre profil pour l'instant."));
  }, []);

  return (
    <EspaceShell>
      <ThemeAstralVue profil={profil} erreur={erreur} />
    </EspaceShell>
  );
}
