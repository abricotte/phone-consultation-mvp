import { emblemeParCle } from "@/lib/emblemes";

/** L'emblème dans son rond de couleur. Le dessin est recoloré (masque), en
 *  aubergine par défaut. Rend null si la clé est inconnue. */
export default function Embleme({ cle, taille = 48, couleur = "#232B45", fond }: { cle: string | null | undefined; taille?: number; couleur?: string; fond?: string }) {
  const e = emblemeParCle(cle);
  if (!e) return null;
  const url = `url(/images/avatars-trait/${e.cle}.svg)`;
  const dessin = taille * (taille < 48 ? 0.84 : 0.74);
  return (
    <span
      role="img"
      aria-label={e.nom}
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: taille, height: taille, background: fond ?? e.fond }}
    >
      <span
        aria-hidden
        style={{
          width: dessin, height: dessin, backgroundColor: couleur,
          WebkitMaskImage: url, maskImage: url, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskPosition: "center", maskPosition: "center",
        }}
      />
    </span>
  );
}
