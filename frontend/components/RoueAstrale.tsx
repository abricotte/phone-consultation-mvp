// LA ROUE — la carte du ciel dessinée. Douze secteurs en pastel par
// élément, l'ascendant à gauche quand il est connu (sinon 0° Bélier à
// gauche, sans axes), les astres à leur degré, les aspects serrés en
// traits dorés au centre. Coordonnées arrondies : serveur et navigateur
// doivent écrire les mêmes chiffres (hydratation).

import { SIGNES } from "@/lib/astro-savoirs";

const COULEUR: Record<string, string> = { feu: "#F3D9CF", terre: "#E6EBDD", air: "#F7F0D9", eau: "#DCE6F0" };

export type AstreRoue = { cle: string; glyphe: string; lon: number; moderne?: boolean };
export type TraitRoue = { a: number; b: number; fort?: boolean };

export default function RoueAstrale({ asc, mc, astres, traits = [], centre, sousCentre }: { asc: number | null; mc: number | null; astres: AstreRoue[]; traits?: TraitRoue[]; centre?: string; sousCentre?: string }) {
  const ref = asc ?? 0;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const pos = (lon: number, r: number) => {
    const phi = ((180 + (lon - ref)) * Math.PI) / 180;
    return { x: r2(200 + r * Math.cos(phi)), y: r2(200 - r * Math.sin(phi)) };
  };
  const secteur = (l1: number, l2: number, rExt: number, rInt: number) => {
    const a = pos(l1, rExt), b = pos(l2, rExt), c = pos(l2, rInt), d = pos(l1, rInt);
    return `M ${a.x} ${a.y} A ${rExt} ${rExt} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rInt} ${rInt} 0 0 1 ${d.x} ${d.y} Z`;
  };
  const R = 190, Rin = 150, Rc = 70;

  // Les astres proches se repoussent sur le rayon pour ne pas se recouvrir
  const tries = [...astres].sort((a, b) => a.lon - b.lon);
  const rayons = new Map<string, number>();
  let dernier = -999, niveau = 0;
  for (const a of tries) {
    const d = Math.abs(a.lon - dernier);
    niveau = d < 9 ? (niveau + 1) % 3 : 0;
    rayons.set(a.cle, 122 - niveau * 24);
    dernier = a.lon;
  }

  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-[440px]" role="img" aria-label="La roue du thème astral">
      <circle cx="200" cy="200" r={R} fill="#FFFDF8" stroke="#c9a96e" strokeWidth="1.2" />
      {SIGNES.map((s, i) => {
        const m = pos(i * 30 + 15, (R + Rin) / 2);
        return (
          <g key={s.nom}>
            <path d={secteur(i * 30, i * 30 + 30, R, Rin)} fill={COULEUR[s.element]} stroke="#FFFFFF" strokeWidth="1.5" />
            <text x={m.x} y={m.y + 6} textAnchor="middle" fontSize="17" fill="#3B2A4A">{s.glyphe}</text>
          </g>
        );
      })}
      <circle cx="200" cy="200" r={Rin} fill="none" stroke="#c9a96e" strokeWidth="1" />
      {Array.from({ length: 36 }, (_, i) => {
        const a = pos(i * 10, Rin), b = pos(i * 10, Rin - (i % 3 === 0 ? 10 : 5));
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9a96e" strokeWidth="0.8" />;
      })}
      {asc !== null && (
        <>
          {[asc, asc + 180].map((l) => { const p = pos(l, Rin); return <line key={l} x1="200" y1="200" x2={p.x} y2={p.y} stroke="#3B2A4A" strokeWidth="1.2" />; })}
          {mc !== null && [mc, mc + 180].map((l) => { const p = pos(l, Rin); return <line key={l} x1="200" y1="200" x2={p.x} y2={p.y} stroke="#3B2A4A" strokeWidth="0.8" strokeDasharray="3 3" />; })}
          {(() => { const p = pos(asc, R); return <text x={p.x - 14} y={p.y + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="#3B2A4A">AC</text>; })()}
          {mc !== null && (() => { const p = pos(mc, R); return <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#3B2A4A">MC</text>; })()}
        </>
      )}
      <circle cx="200" cy="200" r={Rc} fill="#FBF3E2" stroke="#c9a96e" strokeWidth="0.8" />
      {traits.map((tr) => {
        const p = pos(tr.a, Rc), q = pos(tr.b, Rc);
        return <line key={`${tr.a}-${tr.b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={tr.fort ? "#8a6f3e" : "#c9a96e"} strokeWidth={tr.fort ? 1.3 : 0.8} opacity={tr.fort ? 0.85 : 0.5} />;
      })}
      {astres.map((a) => {
        const rp = rayons.get(a.cle) ?? 122;
        const p = pos(a.lon, rp), t = pos(a.lon, Rin - 2), q = pos(a.lon, Rc);
        return (
          <g key={a.cle}>
            <line x1={t.x} y1={t.y} x2={q.x} y2={q.y} stroke="#3B2A4A" strokeWidth="0.5" opacity="0.3" />
            <circle cx={p.x} cy={p.y} r="11" fill={a.moderne ? "#F7F3EE" : "#FFFFFF"} stroke={a.moderne ? "#B4B2A9" : "#3B2A4A"} strokeWidth="1" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fill={a.moderne ? "#7c695e" : "#3B2A4A"}>{a.glyphe}</text>
          </g>
        );
      })}
      {centre && <text x="200" y="196" textAnchor="middle" fontSize="11" fill="#8a6f3e" fontStyle="italic">{centre}</text>}
      {sousCentre && <text x="200" y="211" textAnchor="middle" fontSize="8.5" fill="#7c695e">{sousCentre}</text>}
    </svg>
  );
}
