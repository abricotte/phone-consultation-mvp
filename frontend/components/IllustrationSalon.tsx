// L'ILLUSTRATION DU SALON (Elena, 16 octobre, d'après son modèle) : un
// plateau rose, la théière bleu nuit à l'étoile d'or, deux tasses qui
// fument — lavande et rose —, des cartes posées, des étoiles. Dessinée à la
// main en SVG, aux couleurs de la charte ; les nombres sont arrondis (pas
// d'écart entre serveur et navigateur).

const NUIT = "#2B3560";
const OR = "#F2C14E";
const OR_FONCE = "#D99A2B";
const ROSE = "#F7D6E2";
const ROSE_TRAIT = "#D9A3BB";
const LAVANDE = "#E6DBF5";
const THE = "#C98A5E";

function Etoile({ x, y, r, couleur = OR, opacite = 1 }: { x: number; y: number; r: number; couleur?: string; opacite?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`);
  }
  return <polygon points={pts.join(" ")} fill={couleur} opacity={opacite} />;
}

function Vapeur({ x, y }: { x: number; y: number }) {
  return (
    <g fill="none" stroke={ROSE_TRAIT} strokeWidth="2" strokeLinecap="round" opacity="0.8">
      {[-8, 0, 8].map((dx) => (
        <path key={dx} d={`M${x + dx} ${y} c -6 -10 6 -18 0 -28 c -6 -10 6 -18 0 -28`} />
      ))}
    </g>
  );
}

function Tasse({ x, y, couleur }: { x: number; y: number; couleur: string }) {
  return (
    <g>
      <Vapeur x={x} y={y - 8} />
      {/* soucoupe */}
      <ellipse cx={x} cy={y + 36} rx="44" ry="8" fill="#FFFFFF" stroke={ROSE_TRAIT} strokeWidth="2" />
      {/* tasse */}
      <path d={`M${x - 28} ${y} h56 a28 30 0 0 1 -56 0 z`} fill={couleur} stroke={ROSE_TRAIT} strokeWidth="2" />
      <ellipse cx={x} cy={y} rx="28" ry="5" fill={THE} stroke={ROSE_TRAIT} strokeWidth="1.5" />
      <circle cx={x + 34} cy={y + 10} r="7" fill="none" stroke={ROSE_TRAIT} strokeWidth="2" />
    </g>
  );
}

function Carte({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <g transform={`rotate(${angle} ${x + 14} ${y + 22})`}>
      <rect x={x} y={y} width="28" height="44" rx="4" fill={NUIT} stroke={OR} strokeWidth="2" />
      <Etoile x={x + 14} y={y + 22} r={5} />
    </g>
  );
}

export default function IllustrationSalon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 660 200" className={className} role="img" aria-label="Un plateau de thé, deux tasses fumantes, des cartes et des étoiles">
      {/* les étoiles */}
      <Etoile x={56} y={70} r={8} couleur={OR_FONCE} />
      <Etoile x={190} y={14} r={7} couleur={OR_FONCE} />
      <Etoile x={236} y={82} r={4} opacite={0.7} />
      <Etoile x={300} y={74} r={7} />
      <Etoile x={366} y={96} r={4} opacite={0.6} />
      <Etoile x={396} y={32} r={7} couleur={OR_FONCE} />
      <Etoile x={398} y={80} r={7} />
      <Etoile x={412} y={50} r={5} opacite={0.8} />
      <Etoile x={410} y={18} r={4} opacite={0.6} />
      <Etoile x={480} y={90} r={6} couleur={OR_FONCE} />
      <Etoile x={488} y={14} r={4} couleur={OR_FONCE} />
      <Etoile x={604} y={20} r={5} />

      {/* le plateau */}
      <ellipse cx="330" cy="160" rx="278" ry="34" fill={ROSE} />
      <ellipse cx="330" cy="156" rx="250" ry="22" fill="#FFFFFF" stroke={ROSE_TRAIT} strokeWidth="2" />

      <Tasse x={178} y={108} couleur={LAVANDE} />
      <Tasse x={462} y={108} couleur="#F6C8D6" />

      {/* la théière */}
      <g>
        <path d="M262 122 c -14 0 -14 26 4 26" fill="none" stroke={OR} strokeWidth="3" />
        <path d="M356 118 c 16 -4 22 -14 32 -30" fill="none" stroke={OR} strokeWidth="6" strokeLinecap="round" />
        <circle cx="320" cy="122" r="40" fill={NUIT} />
        <ellipse cx="320" cy="84" rx="15" ry="7" fill={OR} />
        <circle cx="320" cy="73" r="5" fill={NUIT} />
        <Etoile x={320} y={122} r={11} />
      </g>

      <Carte x={84} y={124} angle={-12} />
      <Carte x={110} y={124} angle={-4} />
      <Carte x={524} y={124} angle={10} />
    </svg>
  );
}
