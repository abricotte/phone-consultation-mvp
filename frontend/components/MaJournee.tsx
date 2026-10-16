"use client";

import { useEffect, useState } from "react";
import { calculerJournee, type Journee } from "@/lib/journee";
import { capitaliser } from "@/lib/format";

// MA JOURNÉE — en tête de Mon profil : la date, la Lune, et le paragraphe
// du jour dans la voix d'Elena. Calculé dans le navigateur après le
// montage (la date du jour est celle de la cliente, pas du serveur).
// Ce qui choisit l'ouverture ne se montre jamais : on ne parle que du ciel.
// Couleur d'aube — lavande, rose pâle, pêche (Elena, 16 octobre : « quelque
// chose de doux »).

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
    <section className="relative mt-5 overflow-hidden rounded-3xl border border-[#E4DAF1] bg-gradient-to-br from-[#EFEAF8] via-[#F9EFF5] to-[#FDF1EA] p-7 shadow-soft">
      <span aria-hidden className="pointer-events-none absolute right-7 top-5 text-lg text-[#B9A6DA]">✦</span>
      <span aria-hidden className="pointer-events-none absolute right-14 top-12 text-[0.6rem] text-[#E2A9C0]">✦</span>
      <span aria-hidden className="pointer-events-none absolute right-24 top-6 text-[0.55rem] text-gold/50">✦</span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A5FA8]">
        Ma journée{dateLongue ? ` · ${dateLongue}` : ""}
      </p>
      {j ? (
        <>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-serif text-[26px] font-semibold leading-tight text-aubergine">
              <span className="mr-1.5 text-[#9C82C8]">{j.lune.glyphe + "︎"}</span>Lune en {j.lune.signe}
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
          {/* La signature (Elena, 16 octobre) : la méthode, le ciel, les astres —
              jamais les nombres */}
          <p className="mt-3 text-[12px] text-mention">
            Calculé pour vous{prenom ? `, ${capitaliser(prenom)},` : ""} selon la méthode Wolska : d&apos;après votre ciel de naissance et la
            position des astres ce jour. — Elena
          </p>
        </>
      ) : (
        <p className="mt-2 text-[14px] text-ink/80">
          Votre journée se lit à partir de votre date de naissance. Notez-la dans votre carte, juste au-dessus, et revenez demain matin.
        </p>
      )}
    </section>
  );
}
