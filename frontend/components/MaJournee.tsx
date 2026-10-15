"use client";

import { useEffect, useState } from "react";
import { calculerJournee, type Journee } from "@/lib/journee";

// MA JOURNÉE — en tête de Mon profil : la date, la Lune, et le paragraphe
// du jour dans la voix d'Elena. Calculé dans le navigateur après le
// montage (la date du jour est celle de la cliente, pas du serveur).
// Ce qui choisit l'ouverture ne se montre jamais : on ne parle que du ciel.

export default function MaJournee({ dateNaissance, prenom }: { dateNaissance: string | null; prenom?: string | null }) {
  const [j, setJ] = useState<Journee | null>(null);
  const [dateLongue, setDateLongue] = useState("");

  useEffect(() => {
    const now = new Date();
    setDateLongue(now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));
    if (dateNaissance) {
      try { setJ(calculerJournee(dateNaissance, now)); } catch { setJ(null); }
    }
  }, [dateNaissance]);

  return (
    <section className="relative mt-5 overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-[#FBF3E2] via-cream to-blush p-7 shadow-soft">
      <span aria-hidden className="pointer-events-none absolute right-7 top-5 text-lg text-gold/60">✦</span>
      <span aria-hidden className="pointer-events-none absolute right-14 top-12 text-[0.6rem] text-gold/40">✦</span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
        Ma journée{dateLongue ? ` · ${dateLongue}` : ""}
      </p>
      {j ? (
        <>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-serif text-[26px] font-semibold leading-tight text-aubergine">
              <span className="mr-1.5 text-gold-dark">{j.lune.glyphe}</span>Lune en {j.lune.signe}
            </span>
            <span className="text-[13px] text-mention">
              {j.lune.phase === "nouvelle" ? "nouvelle lune" : j.lune.phase === "pleine" ? "pleine lune" : `lune ${j.lune.phase}`}
              {j.venusRetro && " · Vénus rétrograde"}
              {j.mercureRetro && " · Mercure rétrograde"}
            </span>
          </p>
          <p className="mt-3 max-w-2xl font-serif text-[18px] italic leading-relaxed text-ink">
            {j.phrases.join(" ")}
          </p>
          <p className="mt-3 text-[12px] text-mention">D&apos;après votre ciel du jour{prenom ? `, ${prenom}` : ""}. Un paragraphe par jour, jamais deux fois le même. — Elena</p>
        </>
      ) : (
        <p className="mt-2 text-[14px] text-ink/80">
          Votre journée se lit à partir de votre date de naissance. Notez-la ci-dessous, et revenez demain matin.
        </p>
      )}
    </section>
  );
}
