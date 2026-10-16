"use client";

import { useMemo, useState } from "react";
import { anneePersonnelle, moisPersonnel, nombres, MOT_DU_NOMBRE, COULEUR_DU_NOMBRE, SENS_DETTE, SENS_LECON, SENS_PASSION } from "@/lib/numerologie";
import { jourPersonnel } from "@/lib/journee";

// SES NOMBRES — au cabinet seulement : la cliente ne voit jamais de
// numérologie dans son espace (décision du 14 octobre). En tableau de bord
// (Elena, 16 octobre) : les nombres à gauche, un petit calendrier à droite
// pour faire défiler les mois — son mois personnel en novembre, en
// décembre… — et toucher un jour pour voir son jour personnel.
// La même carte sert pour la cliente (complète) et pour ses proches
// (compacte : sans nom de famille, seuls les nombres de la date).

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

function teinte(v: number | null | undefined) {
  if (!v) return { fond: "#FBF7F2", encre: "#232B45" };
  return COULEUR_DU_NOMBRE[v] ?? COULEUR_DU_NOMBRE[v % 9 || 9] ?? { fond: "#FBF7F2", encre: "#232B45" };
}

function Nb({ v, label, sous }: { v: number | null; label: string; sous?: string }) {
  const c = teinte(v);
  return (
    <li className="flex items-baseline gap-3 rounded-xl border border-white/70 px-4 py-2.5" style={{ backgroundColor: c.fond }}>
      <span className="w-12 shrink-0 font-serif text-[34px] font-bold leading-none" style={{ color: c.encre }}>{v ?? "—"}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-ink">{label}</span>
        <span className="block text-[13px] font-medium text-ink/70">{sous ?? (v ? MOT_DU_NOMBRE[v] : "renseigner le nom")}</span>
      </span>
    </li>
  );
}

export default function SesNombres({
  titre,
  sousTitre,
  dateNaissance,
  nomComplet,
  compact = false,
}: {
  titre: string;
  sousTitre?: string;
  dateNaissance: string | null;
  nomComplet?: string | null;
  compact?: boolean;
}) {
  const auj = new Date();
  const [vue, setVue] = useState<{ a: number; m: number }>({ a: auj.getFullYear(), m: auj.getMonth() + 1 });
  const [jour, setJour] = useState<number | null>(auj.getDate());

  const n = dateNaissance ? nombres(dateNaissance, nomComplet ?? null) : null;

  // Le mois affiché : son année et son mois personnels, et chaque jour
  const cal = useMemo(() => {
    const naissance = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateNaissance || "");
    if (!naissance || !dateNaissance) return null;
    const j = Number(naissance[3]), mo = Number(naissance[2]);
    const ap = anneePersonnelle(j, mo, vue.a);
    const mp = moisPersonnel(ap, vue.m);
    const nbJours = new Date(vue.a, vue.m, 0).getDate();
    const decalage = (new Date(vue.a, vue.m - 1, 1).getDay() + 6) % 7; // lundi en premier
    const jours = Array.from({ length: nbJours }, (_, i) => ({ d: i + 1, v: jourPersonnel(dateNaissance, new Date(vue.a, vue.m - 1, i + 1, 12)) }));
    return { ap, mp, jours, decalage };
  }, [dateNaissance, vue.a, vue.m]);

  const estCeMois = vue.a === auj.getFullYear() && vue.m === auj.getMonth() + 1;
  const jourChoisi = cal && jour && jour <= cal.jours.length ? cal.jours[jour - 1] : null;
  const changerMois = (pas: number) => {
    setVue(({ a, m }) => {
      const t = m + pas;
      return t < 1 ? { a: a - 1, m: 12 } : t > 12 ? { a: a + 1, m: 1 } : { a, m: t };
    });
    setJour(null);
  };

  return (
    <section className={`rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/[0.07] to-ivory shadow-soft ${compact ? "p-5" : "p-7"}`}>
      <h2 className={`font-jakarta font-bold tracking-tight text-aubergine ${compact ? "text-lg" : "text-xl"}`}>{titre}</h2>
      {sousTitre && <p className="mt-0.5 text-sm font-medium text-ink/70">{sousTitre}</p>}

      {!n || !cal ? (
        <p className="mt-3 text-sm font-medium text-ink/70">Pas de date de naissance renseignée.</p>
      ) : (
        <div className={`mt-4 grid items-start gap-4 ${compact ? "sm:grid-cols-[1fr_230px]" : "lg:grid-cols-[1fr_300px]"}`}>
          <div className="min-w-0">
            <ul className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
              <Nb
                v={jourChoisi?.v ?? null}
                label={jourChoisi ? `Jour personnel · ${jourChoisi.d} ${MOIS[vue.m - 1]}` : "Jour personnel"}
                sous={jourChoisi ? (jourChoisi.v ? MOT_DU_NOMBRE[jourChoisi.v] : "") : "touchez un jour du calendrier"}
              />
              <Nb v={cal.mp} label={`Mois personnel · ${MOIS[vue.m - 1]}${vue.a !== auj.getFullYear() ? ` ${vue.a}` : ""}`} />
              <Nb v={cal.ap} label={`Année personnelle ${vue.a}`} />
              <Nb v={n.cheminDeVie} label="Chemin de vie" />
              {!compact && (
                <>
                  <Nb v={n.expression} label="Expression" />
                  <Nb v={n.elan} label="Élan de l'âme" />
                  <Nb v={n.personnalite} label="Personnalité" />
                </>
              )}
            </ul>

            {!compact && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  { titre: "Dettes karmiques", liste: n.dettes, sens: SENS_DETTE, vide: "Aucune dette karmique." },
                  { titre: "Leçons karmiques", liste: n.lecons, sens: SENS_LECON, vide: n.expression != null ? "Aucune leçon : tous les chiffres sont dans son nom." : "Renseigner le nom." },
                  { titre: "Passion cachée", liste: n.passion, sens: SENS_PASSION, vide: n.expression != null ? "Pas de passion dominante." : "Renseigner le nom." },
                ].map((bloc) => (
                  <div key={bloc.titre} className="rounded-xl border border-greige/50 bg-white/70 px-4 py-3">
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-gold-dark">{bloc.titre}</p>
                    {bloc.liste.length === 0 ? (
                      <p className="mt-1.5 text-[13px] font-medium text-ink/70">{bloc.vide}</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {bloc.liste.map((x) => {
                          const c = teinte(x);
                          return (
                            <li key={x} className="flex items-start gap-2.5">
                              <span className="flex h-8 min-w-[2rem] shrink-0 items-center justify-center rounded-full px-1.5 font-serif text-[17px] font-bold" style={{ backgroundColor: c.fond, color: c.encre }}>
                                {x}
                              </span>
                              <span className="text-[13px] font-medium leading-snug text-ink/85">{bloc.sens[x] ?? ""}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            {compact && n.dettes.length > 0 && (
              <p className="mt-2 text-[13px] font-medium text-ink/75">
                Dette karmique : {n.dettes.map((d) => `${d} — ${SENS_DETTE[d] ?? ""}`).join(" · ")}
              </p>
            )}
          </div>

          {/* Le petit calendrier : un mois, chaque jour avec son nombre — sans
              couleurs, elles brouillaient le regard (Elena, 16 octobre) */}
          <div className="rounded-2xl border border-greige/50 bg-white/80 p-3">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => changerMois(-1)} aria-label="Mois précédent" className="h-8 w-8 rounded-full text-lg text-aubergine hover:bg-cream">‹</button>
              <p className="text-[14px] font-bold capitalize text-aubergine">
                {MOIS[vue.m - 1]} {vue.a}
                <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-cream px-1.5 font-serif text-[14px] text-aubergine ring-1 ring-greige" title="Mois personnel">
                  {cal.mp}
                </span>
              </p>
              <button type="button" onClick={() => changerMois(1)} aria-label="Mois suivant" className="h-8 w-8 rounded-full text-lg text-aubergine hover:bg-cream">›</button>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center">
              {JOURS.map((d, i) => (
                <span key={i} className="text-[10.5px] font-semibold text-mention">{d}</span>
              ))}
              {Array.from({ length: cal.decalage }).map((_, i) => <span key={`v${i}`} />)}
              {cal.jours.map(({ d, v }) => {
                const aujourdhui = estCeMois && d === auj.getDate();
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setJour(d)}
                    title={`${d} ${MOIS[vue.m - 1]} · jour ${v ?? "—"}`}
                    className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[10.5px] leading-none text-aubergine transition ${aujourdhui ? "bg-[#EAD7A8] font-semibold" : "bg-cream/70 hover:bg-cream"} ${jour === d ? "ring-2 ring-aubergine" : aujourdhui ? "ring-2 ring-gold" : ""}`}
                  >
                    <span className={aujourdhui ? "text-aubergine/80" : "text-mention"}>{d}</span>
                    <span className="mt-0.5 font-serif text-[14px] font-bold">{v}</span>
                  </button>
                );
              })}
            </div>
            {!estCeMois && (
              <button type="button" onClick={() => { setVue({ a: auj.getFullYear(), m: auj.getMonth() + 1 }); setJour(auj.getDate()); }} className="mt-2 text-[12px] font-semibold text-prix hover:underline">
                Revenir à aujourd&apos;hui
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
