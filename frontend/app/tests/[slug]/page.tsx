"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EspaceShell from "@/components/EspaceShell";
import TestSpirituel from "@/components/TestSpirituel";
import { entreeParSlug } from "@/lib/tests";
import type { ResultatEnregistre } from "@/lib/tests/types";
import { api } from "@/lib/api";

// Un test, dans l'espace. Le résultat est enregistré dès qu'il s'affiche
// (le profil et la date — pas les réponses).

export default function TestPage() {
  const { slug } = useParams<{ slug: string }>();
  const entree = entreeParSlug(slug);
  const [dernier, setDernier] = useState<ResultatEnregistre | null>(null);
  const [enregistre, setEnregistre] = useState<string | null>(null);

  useEffect(() => {
    api.getTests().then((d: { resultats: ResultatEnregistre[] }) => {
      const r = (d?.resultats ?? []).find((x) => x.test === slug) ?? null;
      setDernier(r);
    }).catch(() => {});
  }, [slug]);

  if (!entree) {
    return (
      <EspaceShell>
        <p className="font-serif text-2xl text-aubergine">Ce test n&apos;existe pas.</p>
        <a href="/tests" className="mt-3 inline-block text-[13px] font-semibold text-prix hover:underline">Retour aux tests</a>
      </EspaceShell>
    );
  }
  if (!entree.test) {
    return (
      <EspaceShell>
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Bientôt</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-aubergine">{entree.titre}</h1>
        <p className="mt-2 text-[15px] text-ink/80">Ce test arrive dans votre espace, avec son résultat gardé.</p>
        <a href="/tests" className="mt-4 inline-block text-[13px] font-semibold text-prix hover:underline">Retour aux tests</a>
      </EspaceShell>
    );
  }

  return (
    <EspaceShell>
      <a href="/tests" className="mb-6 inline-block text-[13px] text-mention hover:underline">← Tests spirituels</a>
      <TestSpirituel
        test={entree.test}
        dejaFait={dernier ? { titreProfil: dernier.titreProfil, creeLe: dernier.creeLe } : null}
        onResultat={(r) => {
          if (enregistre === r.profil) return;
          setEnregistre(r.profil);
          api.saveTest({ test: slug, profil: r.profil, titreProfil: r.titreProfil, score: r.score }).catch(() => {});
        }}
      />
    </EspaceShell>
  );
}
