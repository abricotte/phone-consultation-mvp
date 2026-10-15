"use client";

import { useMemo } from "react";
import RoueAstrale from "@/components/RoueAstrale";
import { Filet } from "@/components/Ornements";
import { formatDateNaissance } from "@/lib/astro";
import { ASPECTS, DIGNITES, ETAPES_LECTURE, LIMITES, MAISONS, MODERNES, PLANETES, REPERES_HISTORIQUES, SIGNES, TEMPERAMENTS, type ClePlanete } from "@/lib/astro-savoirs";
import { calculerTheme, libellePosition, type Astre, type Theme } from "@/lib/theme-astral";

// VOTRE THÈME ASTRAL — la carte du ciel, lue selon la grammaire ancienne
// (document d'Elena, « Les anciens savoirs du thème astral », 14 octobre
// 2026) : fiche technique, secte, ascendant et son maître, les sept
// planètes en cinq blocs (donnée · tradition · combinaison · polarité ·
// question), les douze lieux par leurs maîtres, les aspects, les
// dignités, les lots, la profection ; les modernes à part ; les repères
// historiques et les limites. Chaque bloc porte son niveau : attesté ·
// traditionnel · adaptation. Les « adaptations » sont des gabarits qu'Elena
// réécrira dans sa voix, avec les fichiers qu'elle apportera.

export type ProfilTheme = { prenom: string | null; dateNaissance: string | null; heureNaissance?: string | null; lieuNaissance?: string | null; latitude?: number | null; longitude?: number | null; fuseau?: string | null };

function Etiquette({ niveau }: { niveau: "attesté" | "traditionnel" | "adaptation" }) {
  const teinte = niveau === "attesté" ? "bg-[#EDF4EC] text-[#2F5D3A]" : niveau === "traditionnel" ? "bg-[#FBF3E2] text-[#7A5A12]" : "bg-[#F8EDF2] text-[#8E2E55]";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${teinte}`}>{niveau}</span>;
}

function nomMaison(n: number | null) {
  if (!n) return null;
  const m = MAISONS[n - 1];
  return `${m.romain}, ${m.nomAncien}`;
}

// La vue seule : les pages (la vraie, l'aperçu) l'enveloppent dans le shell.
export default function ThemeAstralVue({ profil, erreur = "" }: { profil: ProfilTheme | null; erreur?: string }) {

  const theme: Theme | null = useMemo(() => {
    if (!profil?.dateNaissance) return null;
    try {
      return calculerTheme({ dateNaissance: profil.dateNaissance, heureNaissance: profil.heureNaissance, latitude: profil.latitude, longitude: profil.longitude, fuseau: profil.fuseau });
    } catch {
      return null;
    }
  }, [profil]);

  const entete = (
    <header className="mb-6 max-w-2xl">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Mes études · Qui suis-je ?</p>
      <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">Votre thème astral</h1>
    </header>
  );

  if (!profil && !erreur) return <>{entete}<p className="text-sm text-mention">Je lis votre ciel…</p></>;
  if (erreur || !profil?.dateNaissance || !theme) {
    return (
      <>
        {entete}
        <p className="max-w-xl text-[15px] leading-relaxed text-ink/85">
          {erreur || <>Il me faut votre date de naissance pour dessiner votre ciel. Notez-la dans <a href="/profil" className="font-semibold text-prix hover:underline">Mon profil</a> — l&apos;heure et le lieu ensuite, pour l&apos;ascendant et les maisons.</>}
        </p>
      </>
    );
  }

  const t = theme;
  const soleil = t.planetes[0], lune = t.planetes[1];
  const ascSigne = t.asc === null ? null : Math.floor(t.asc / 30);
  const par = (cle: ClePlanete) => t.planetes.find((p) => p.cle === cle)!;
  const prenom = profil.prenom || "vous";
  const sousTitre = [formatDateNaissance(profil.dateNaissance), t.heureConnue ? profil.heureNaissance?.replace(":", " h ") : "heure inconnue", profil.lieuNaissance || null].filter(Boolean).join(" · ");

  const astresRoue = [
    ...t.planetes.map((p) => ({ cle: p.cle, glyphe: p.glyphe, lon: p.lon })),
    ...t.modernes.map((p) => ({ cle: p.cle, glyphe: p.glyphe, lon: p.lon, moderne: true })),
    { cle: "noeud_nord", glyphe: "☊", lon: t.noeuds[0].lon, moderne: true },
  ];
  const traits = t.aspects.filter((a) => a.serre).map((a) => ({ a: par(a.a).lon, b: par(a.b).lon, fort: a.type === "conjonction" || a.type === "opposition" || a.type === "carre" }));

  const luminaireSecte = t.secte === "diurne" ? "soleil" : "lune";
  const benefiqueSecte: ClePlanete = t.secte === "diurne" ? "jupiter" : "venus";
  const malefiqueSecte: ClePlanete = t.secte === "diurne" ? "saturne" : "mars";

  function Position({ a }: { a: Astre }) {
    return (
      <span className="font-serif text-[15px] text-aubergine">
        {a.glyphe} {libellePosition(a.lon)}
        {a.retro && <span className="ml-1 text-[11px] font-semibold text-mention">℞</span>}
      </span>
    );
  }

  return (
    <>
      {entete}
      <p className="-mt-3 mb-6 max-w-2xl font-serif text-xl italic leading-relaxed text-mention">
        La carte du ciel à la minute où vous êtes née : où se tenaient le Soleil, la Lune et les planètes — {sousTitre}.
      </p>

      {!t.heureConnue && (
        <p className="mb-6 max-w-2xl rounded-[18px] border border-gold/40 bg-[#FBF3E2] px-4 py-3 text-[14px] text-ink">
          <span className="mr-1.5 text-gold">✦</span>
          Sans votre heure de naissance, je lis les planètes en signes, à midi — mais ni l&apos;ascendant, ni les maisons, ni la secte : on ne les invente pas. La Lune peut varier de quelques degrés.{" "}
          <a href="/profil" className="font-semibold text-prix hover:underline">Noter mon heure et mon lieu →</a>
        </p>
      )}
      {t.heureConnue && !t.lieuConnu && (
        <p className="mb-6 max-w-2xl rounded-[18px] border border-gold/40 bg-[#FBF3E2] px-4 py-3 text-[14px] text-ink">
          <span className="mr-1.5 text-gold">✦</span>
          Il me manque votre lieu de naissance pour l&apos;ascendant et les maisons.{" "}
          <a href="/profil" className="font-semibold text-prix hover:underline">Le noter →</a>
        </p>
      )}

      {/* ── La roue et les trois entrées ── */}
      <div className="grid items-start gap-8 lg:grid-cols-5">
        <div className="rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#FBF3E2] to-ivory p-4 lg:col-span-3">
          <RoueAstrale asc={t.asc} mc={t.mc} astres={astresRoue} traits={traits} centre={profil.prenom || undefined} sousCentre={sousTitre} />
          <p className="mt-2 text-center text-[12px] text-mention">
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#F3D9CF] align-middle" />feu
            <span className="ml-3 mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#E6EBDD] align-middle" />terre
            <span className="ml-3 mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#F7F0D9] align-middle" />air
            <span className="ml-3 mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#DCE6F0] align-middle" />eau
            <span className="ml-4 text-mention/80">en gris : les modernes et le nœud, hors de la lecture ancienne</span>
          </p>
        </div>
        <div className="lg:col-span-2">
          <ul className="grid grid-cols-3 gap-3">
            {[["Soleil", soleil.glyphe, SIGNES[soleil.signe], soleil.degre], ["Lune", lune.glyphe, SIGNES[lune.signe], lune.degre], ["Ascendant", "AC", ascSigne === null ? null : SIGNES[ascSigne], t.asc === null ? null : Math.floor(t.asc % 30)]].map(([k, g, s, d]) => (
              <li key={k as string} className="rounded-[18px] border border-[#DED6EC] bg-[#F1EDF8] px-3 py-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-dark">{k as string}</p>
                {s ? (
                  <>
                    <p className="mt-1 font-serif text-[21px] font-semibold leading-tight text-aubergine">{(s as (typeof SIGNES)[number]).glyphe} {(s as (typeof SIGNES)[number]).nom}</p>
                    <p className="text-[11px] text-mention">{d as number}°</p>
                  </>
                ) : (
                  <p className="mt-1 text-[12px] text-mention">heure et lieu requis</p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] leading-relaxed text-ink/85">
            Trois entrées, pas tout le thème : <span className="font-semibold text-aubergine">le Soleil</span>, ce que vous êtes venue faire ;{" "}
            <span className="font-semibold text-aubergine">la Lune</span>, ce dont vous avez besoin ;{" "}
            <span className="font-semibold text-aubergine">l&apos;ascendant</span>, ce que les autres voient. Les Anciens ne s&apos;y arrêtaient pas : ils lisaient la secte, le maître de l&apos;ascendant, puis chaque planète dans sa condition.
          </p>

          {/* Fiche technique */}
          <div className="mt-5 rounded-[20px] border border-greige/60 bg-ivory p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Fiche technique</p>
            <ul className="mt-2 space-y-1 text-[13px] text-ink/80">
              <li>Zodiaque <span className="font-semibold text-ink">tropical</span>, écliptique vraie de date · positions calculées par éphémérides (astronomy-engine).</li>
              <li>Maisons <span className="font-semibold text-ink">en signes entiers</span>, comme l&apos;usage hellénistique dominant.</li>
              <li>Les <span className="font-semibold text-ink">sept planètes</span> des Anciens ; Uranus, Neptune, Pluton et les nœuds à part.</li>
              <li>Aspects par signe entier ; « serré » sous 8°, 10° avec un luminaire.</li>
              <li>Lots de Fortune et d&apos;Esprit selon la secte ({t.secte ?? "secte inconnue sans l'heure"}).</li>
              <li>Heure {t.heureConnue ? `locale (${profil.fuseau}), convertie en temps universel : ${t.utc.toISOString().slice(11, 16)} UTC` : "inconnue — calcul à midi"}.</li>
            </ul>
          </div>
        </div>
      </div>

      <Filet />

      {/* ── L'architecture : secte, ascendant, son maître ── */}
      <section>
        <h2 className="font-serif text-[32px] font-semibold leading-tight text-aubergine">L&apos;architecture du thème</h2>
        <p className="mt-2 max-w-2xl font-serif text-lg italic leading-relaxed text-mention">La première question des Anciens : le Soleil est-il au-dessus ou au-dessous de l&apos;horizon ? Puis : qui se lève, et qui gouverne ce qui se lève ?</p>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          <li className="rounded-[20px] border border-[#EAD9B4] bg-[#FBF3E2] p-5">
            <div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">La secte</p><Etiquette niveau="attesté" /></div>
            {t.secte ? (
              <>
                <p className="mt-2 font-serif text-[24px] font-semibold text-aubergine">Thème {t.secte}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">
                  Le Soleil était {t.secte === "diurne" ? "au-dessus" : "sous"} l&apos;horizon. Le luminaire de secte est {t.secte === "diurne" ? "le Soleil" : "la Lune"} ; le bénéfique le plus protecteur, {PLANETES[benefiqueSecte].nom} ; le maléfique le plus constructif, {PLANETES[malefiqueSecte].nom} — l&apos;autre bénéfique ({PLANETES[t.secte === "diurne" ? "venus" : "jupiter"].nom}) et l&apos;autre maléfique ({PLANETES[t.secte === "diurne" ? "mars" : "saturne"].nom}) sont à regarder avec plus d&apos;attention.
                </p>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-mention">Il faut l&apos;heure et le lieu pour savoir si le Soleil était levé.</p>
            )}
          </li>
          <li className="rounded-[20px] border border-[#DED6EC] bg-[#F1EDF8] p-5">
            <div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">L&apos;ascendant</p><Etiquette niveau="attesté" /></div>
            {ascSigne !== null && t.asc !== null ? (
              <>
                <p className="mt-2 font-serif text-[24px] font-semibold text-aubergine">{SIGNES[ascSigne].glyphe} {libellePosition(t.asc)}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">
                  Le signe qui se levait à l&apos;est : le corps, le tempérament, la manière d&apos;entrer dans la vie. {SIGNES[ascSigne].nom} — {SIGNES[ascSigne].sens}. Tempérament de l&apos;élément : {TEMPERAMENTS[SIGNES[ascSigne].element]}.
                </p>
                {t.mc !== null && <p className="mt-1.5 text-[12px] text-mention">Milieu du ciel : {libellePosition(t.mc)} — ce qui devient visible et reconnu.</p>}
              </>
            ) : (
              <p className="mt-2 text-[13px] text-mention">Sans l&apos;heure, pas d&apos;ascendant. Une erreur de quelques minutes peut le déplacer : on préfère ne pas inventer.</p>
            )}
          </li>
          <li className="rounded-[20px] border border-[#D3E0D2] bg-[#EDF4EC] p-5">
            <div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Le maître de l&apos;ascendant</p><Etiquette niveau="traditionnel" /></div>
            {t.maitreAscendant ? (() => { const m = par(t.maitreAscendant); return (
              <>
                <p className="mt-2 font-serif text-[24px] font-semibold text-aubergine">{PLANETES[m.cle as ClePlanete].nom}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">
                  Gestionnaire du corps et de la direction générale. {m.nom} se trouve en {SIGNES[m.signe].nom}, lieu {nomMaison(m.maison)}, {m.dignite === "peregrine" ? "sans dignité majeure (pérégrine)" : `en ${m.dignite}`}{m.retro ? ", rétrograde" : ""}{m.etatSolaire ? `, ${m.etatSolaire}` : ""}. Le maître de l&apos;ascendant raconte souvent mieux la trajectoire que le signe levant lui-même.
                </p>
              </>
            ); })() : (
              <p className="mt-2 text-[13px] text-mention">Il se lit dès que l&apos;ascendant est connu.</p>
            )}
          </li>
        </ul>
      </section>

      <Filet />

      {/* ── Les sept planètes, en cinq blocs ── */}
      <section>
        <h2 className="font-serif text-[32px] font-semibold leading-tight text-aubergine">Les sept planètes</h2>
        <p className="mt-2 max-w-2xl font-serif text-lg italic leading-relaxed text-mention">Pour chacune, la même grille : la donnée, ce que la tradition en dit, la combinaison, la polarité — et une question, jamais une sentence.</p>
        <ol className="mt-6 space-y-5">
          {t.planetes.map((p) => {
            const P = PLANETES[p.cle as ClePlanete], S = SIGNES[p.signe], M = p.maison ? MAISONS[p.maison - 1] : null;
            const deSecte = t.secte ? (P.secte === "variable" ? null : P.secte === t.secte) : null;
            return (
              <li key={p.cle} className="rounded-[24px] border border-greige/60 bg-ivory p-5 md:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-serif text-[26px] font-semibold text-aubergine">
                    <span className="mr-2 text-gold-dark">{p.glyphe}</span>{P.nom} en {S.nom}
                    {p.maison && <span className="text-[16px] font-normal text-mention"> · lieu {MAISONS[p.maison - 1].romain}</span>}
                  </h3>
                  <Position a={p} />
                </div>
                <dl className="mt-4 grid gap-3 md:grid-cols-5">
                  <div className="rounded-[16px] bg-cream/70 p-3.5">
                    <dt className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark"><span>1 · Donnée</span><Etiquette niveau="attesté" /></dt>
                    <dd className="mt-1.5 text-[13px] leading-relaxed text-ink/85">
                      {P.nom} à {libellePosition(p.lon)}{p.maison ? `, lieu ${MAISONS[p.maison - 1].romain} (${M!.force})` : ""}{t.secte ? `, thème ${t.secte}` : ""}.
                      {p.retro && " Rétrograde."}{p.etatSolaire && ` ${p.etatSolaire.charAt(0).toUpperCase() + p.etatSolaire.slice(1)}.`}
                      {deSecte !== null && (deSecte ? " Dans son équipe (de secte)." : " Hors de sa secte.")}
                      {" "}Dignité : {p.dignite === "peregrine" ? "pérégrine" : p.dignite}.
                    </dd>
                  </div>
                  <div className="rounded-[16px] bg-cream/70 p-3.5">
                    <dt className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark"><span>2 · Tradition</span><Etiquette niveau="traditionnel" /></dt>
                    <dd className="mt-1.5 text-[13px] leading-relaxed text-ink/85">
                      {P.nom} : {P.nature} — {P.significations}. {S.nom}, maître {PLANETES[S.maitre].nom}, {S.element} {S.mode} : {S.sens}.{M ? ` Lieu ${M.romain}, ${M.nomAncien} : ${M.sens}.` : ""}
                    </dd>
                  </div>
                  <div className="rounded-[16px] bg-cream/70 p-3.5">
                    <dt className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark"><span>3 · Combinaison</span><Etiquette niveau="adaptation" /></dt>
                    <dd className="mt-1.5 text-[13px] leading-relaxed text-ink/85">
                      Les facultés de {P.nom} ({P.constructif}) prennent le style {S.nom} — {S.sens.split(",")[0]}, {S.sens.split(",")[1]?.trim()} —{M ? ` et cherchent à s'exercer là où la vie parle de ${M.sens.split(",")[0]} et de ${M.sens.split(",")[1]?.trim()}` : " dans un domaine que l'heure de naissance préciserait"}.{p.dignite === "domicile" || p.dignite === "exaltation" ? " Elles disposent de ressources." : p.dignite === "exil" || p.dignite === "chute" ? " Elles agissent en territoire moins familier : plus d'effort, parfois plus d'invention." : ""}
                    </dd>
                  </div>
                  <div className="rounded-[16px] bg-cream/70 p-3.5">
                    <dt className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark"><span>4 · Polarité</span><Etiquette niveau="adaptation" /></dt>
                    <dd className="mt-1.5 text-[13px] leading-relaxed text-ink/85">
                      Du côté lumineux : {P.constructif}. Sous tension : {P.difficile} — et la difficulté propre au signe, {S.difficulte}.
                    </dd>
                  </div>
                  <div className="rounded-[16px] bg-[#F8EDF2] p-3.5">
                    <dt className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark"><span>5 · Question</span><Etiquette niveau="adaptation" /></dt>
                    <dd className="mt-1.5 font-serif text-[15px] italic leading-relaxed text-aubergine">
                      {M ? M.question : `Où, dans votre vie, ${P.nom} demande-t-il à agir — et le laissez-vous faire ?`}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      </section>

      <Filet />

      {/* ── Les douze lieux par leurs maîtres ── */}
      <section>
        <h2 className="font-serif text-[32px] font-semibold leading-tight text-aubergine">Les douze lieux</h2>
        {ascSigne === null ? (
          <p className="mt-2 max-w-2xl text-[14px] text-mention">Les maisons demandent l&apos;heure et le lieu de naissance. Sans eux, elles ne sont pas calculées.</p>
        ) : (
          <>
            <p className="mt-2 max-w-2xl font-serif text-lg italic leading-relaxed text-mention">Une maison vide n&apos;est pas inactive : son maître raconte le sujet. Pour chaque lieu, le signe, son maître, et où ce maître se trouve.</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MAISONS.map((m) => {
                const s = SIGNES[(ascSigne + m.num - 1) % 12];
                const maitre = par(s.maitre);
                const dedans = t.planetes.filter((p) => p.maison === m.num);
                return (
                  <li key={m.num} className="rounded-[18px] border border-greige/60 bg-ivory p-4">
                    <p className="flex items-baseline justify-between">
                      <span className="font-serif text-[20px] font-semibold text-aubergine">{m.romain} · {s.glyphe} {s.nom}</span>
                      <span className="text-[11px] text-mention">{m.force}</span>
                    </p>
                    <p className="text-[12px] text-mention">{m.nomAncien}</p>
                    <p className="mt-1.5 text-[13px] text-ink/85">
                      Maître : <span className="font-semibold">{PLANETES[s.maitre].nom}</span>, en {SIGNES[maitre.signe].nom}, lieu {MAISONS[maitre.maison! - 1].romain}{maitre.dignite !== "peregrine" ? ` (${maitre.dignite})` : ""}.
                      {dedans.length > 0 && <> Présentes : {dedans.map((p) => p.nom).join(", ")}.</>}
                      {m.joie && dedans.some((p) => p.cle === m.joie) && <> {PLANETES[m.joie].nom} y est dans sa joie.</>}
                    </p>
                    <p className="mt-1.5 text-[12px] italic text-mention">{m.question}</p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <Filet />

      {/* ── Aspects et dignités ── */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-[28px] font-semibold leading-tight text-aubergine">Les aspects</h2>
          <p className="mt-1 text-[13px] text-mention">Par signe entier, comme les Anciens ; l&apos;orbe exact ensuite. Les serrés d&apos;abord.</p>
          <ul className="mt-4 divide-y divide-greige/60 rounded-[20px] border border-greige/60 bg-ivory">
            {t.aspects.slice(0, 12).map((a) => {
              const A_ = ASPECTS[a.type];
              return (
                <li key={`${a.a}-${a.b}`} className={`px-4 py-3 ${a.serre ? "" : "opacity-70"}`}>
                  <p className="text-[14px] text-ink">
                    <span className="font-semibold text-aubergine">{PLANETES[a.a].glyphe} {PLANETES[a.a].nom} — {PLANETES[a.b].glyphe} {PLANETES[a.b].nom}</span>
                    {" · "}{A_.nom} <span className="text-mention">({A_.angle}°, orbe {a.orbe}°{a.serre ? ", serré" : ", par signe"})</span>
                  </p>
                  <p className="text-[12px] text-ink/75">{A_.nature} — {A_.lecture}.</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[12px] italic text-mention">Un carré avec réception peut valoir mieux qu&apos;un trigone sans ressources : la géométrie seule ne suffit jamais.</p>
        </div>
        <div>
          <h2 className="font-serif text-[28px] font-semibold leading-tight text-aubergine">Les dignités</h2>
          <p className="mt-1 text-[13px] text-mention">La capacité de chaque planète à agir selon sa nature dans son signe. Domicile, exaltation, exil, chute — les termes et les faces viendront.</p>
          <ul className="mt-4 divide-y divide-greige/60 rounded-[20px] border border-greige/60 bg-ivory">
            {t.planetes.map((p) => (
              <li key={p.cle} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span className="text-[14px] font-semibold text-aubergine">{p.glyphe} {p.nom} en {SIGNES[p.signe].nom}</span>
                <span className="text-right text-[12px] text-ink/80">
                  <span className="font-semibold">{p.dignite === "peregrine" ? "pérégrine" : p.dignite}</span> — {DIGNITES[p.dignite ?? "peregrine"].metaphore}
                </span>
              </li>
            ))}
          </ul>
          {t.lots && t.profection && (
            <div className="mt-5 rounded-[20px] border border-[#EAD9B4] bg-[#FBF3E2] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Lots et profection</p>
              <ul className="mt-2 space-y-1 text-[13px] text-ink/85">
                <li><span className="font-semibold">Lot de Fortune</span> : {libellePosition(t.lots.fortune)} — le corps, les circonstances, ce qui advient. <span className="text-mention">(formule {t.secte})</span></li>
                <li><span className="font-semibold">Lot d&apos;Esprit</span> : {libellePosition(t.lots.esprit)} — l&apos;intention, l&apos;action choisie, ce que vous initiez.</li>
                <li><span className="font-semibold">Profection annuelle</span> : à {t.profection.age} ans, l&apos;année active le lieu {MAISONS[t.profection.maison - 1].romain}, en {SIGNES[t.profection.signe].nom} ; le maître de l&apos;année est {PLANETES[t.profection.maitre].nom} — à juger dans le natal.</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <Filet />

      {/* ── Les modernes, à part ── */}
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-[28px] font-semibold leading-tight text-aubergine">Les modernes, à part</h2>
          <Etiquette niveau="adaptation" />
        </div>
        <p className="mt-1 max-w-2xl text-[13px] text-mention">Uranus, Neptune, Pluton et les nœuds n&apos;appartiennent pas à la restitution ancienne. Ils sont ici, nommés comme ce qu&apos;ils sont : une lecture d&apos;aujourd&apos;hui.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[...t.modernes, ...t.noeuds].map((p) => (
            <li key={p.cle} className="rounded-[18px] border border-greige/60 bg-cream/60 p-4">
              <p className="font-serif text-[18px] font-semibold text-aubergine">{p.glyphe} {p.nom} en {SIGNES[p.signe].nom}</p>
              <p className="text-[12px] text-mention">{libellePosition(p.lon)}{p.retro && p.cle !== "noeud_nord" && p.cle !== "noeud_sud" ? " ℞" : ""}{p.maison ? ` · lieu ${MAISONS[p.maison - 1].romain}` : ""}</p>
              <p className="mt-1.5 text-[12px] leading-snug text-ink/75">
                {p.cle === "noeud_nord" ? "Tête du Dragon : augmentation, intensification selon les textes médiévaux — la « mission d'âme » est une lecture moderne." : p.cle === "noeud_sud" ? "Queue du Dragon : diminution, séparation selon le contexte — les « vies antérieures » sont une lecture moderne." : MODERNES[p.cle as "uranus" | "neptune" | "pluton"].mot}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Filet />

      {/* ── Repères historiques, méthode, limites ── */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-[28px] font-semibold leading-tight text-aubergine">D&apos;où vient cette lecture</h2>
          <ul className="mt-4 space-y-4">
            {REPERES_HISTORIQUES.map((r) => (
              <li key={r.titre}>
                <p className="font-semibold text-aubergine">{r.titre}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink/80">{r.texte}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] italic text-mention">Trois niveaux, toujours affichés : <Etiquette niveau="attesté" /> textes et techniques documentés · <Etiquette niveau="traditionnel" /> interprétation interne aux écoles anciennes · <Etiquette niveau="adaptation" /> reformulation d&apos;aujourd&apos;hui, signée Elena Wolska.</p>
        </div>
        <div>
          <h2 className="font-serif text-[28px] font-semibold leading-tight text-aubergine">Comment je lis, et ce que je ne dis pas</h2>
          <ol className="mt-4 space-y-2">
            {ETAPES_LECTURE.map(([t1, d], i) => (
              <li key={t1} className="flex gap-3 text-[13px] leading-relaxed text-ink/85">
                <span className="font-serif text-[16px] font-semibold text-gold-dark">{i + 1}.</span>
                <span><span className="font-semibold text-aubergine">{t1}</span> — {d}</span>
              </li>
            ))}
          </ol>
          <ul className="mt-5 space-y-2 rounded-[20px] border border-greige/60 bg-ivory p-4">
            {LIMITES.map((l) => (
              <li key={l} className="flex gap-2 text-[12px] leading-relaxed text-ink/75"><span aria-hidden className="text-gold">✦</span><span>{l}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-10 text-[14px] text-ink/80">
        <span className="mr-2 text-gold">✦</span>
        Pour ce qui n&apos;est qu&apos;à {prenom} : <a href="/etudes" className="font-semibold text-prix hover:underline">les études complètes</a>, calculées d&apos;après la méthode Wolska.
      </p>
    </>
  );
}
