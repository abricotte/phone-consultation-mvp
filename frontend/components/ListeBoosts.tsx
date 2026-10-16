// LES PETITES CLEFS D'ELENA (nom choisi par Elena le 16 octobre ; on disait « les boosts ») — La Minute Voyance, saison 2 : quelques minutes de la voix
// d'Elena autour d'une réflexion qui ouvre une perspective, bouscule une
// certitude ou apaise. Partagé par Apprendre (en écoutant) et le petit salon.

// Les boosts : un fichier audio par boost (fourni par Elena, dans
// public/audio/boosts), sa durée ; sans fichier, le boost est « bientôt ».
type Boost = { titre: string; src?: string; duree?: string };
// Trois boosts gardés (Elena, 16 octobre). Mis de côté, à reprendre plus
// tard : « Avant de lui écrire », « Après une rupture ».
export const BOOSTS: Boost[] = [
  { titre: "La vulnérabilité, c'est beau aussi", src: "/audio/boosts/la-vulnerabilite.mp4", duree: "2 min 37" },
  { titre: "La solitude est belle, profitez-en" },
  { titre: "Est-ce l'égo ou l'amour qui parle ?" },
];

export default function ListeBoosts() {
  return (
    <ul className="mt-5 divide-y divide-greige/50 rounded-[20px] border border-greige/60 bg-ivory">
      {BOOSTS.map((b) => (
        <li key={b.titre} className="px-5 py-4">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${b.src ? "bg-aubergine text-cream" : "bg-blush text-aubergine/50"}`}
            >
              <span className="ml-0.5 border-y-[7px] border-l-[11px] border-y-transparent border-l-current" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-aubergine">{b.titre}</span>
              {b.duree && <span className="block text-[12px] text-mention">{b.duree} · la voix d&apos;Elena</span>}
            </span>
            <span className="shrink-0 text-[12px] text-gold-dark">{b.src ? "offert" : "offert · bientôt"}</span>
          </div>
          {b.src && (
            // Un mp4 avec une piste audio se lit dans <audio> : le navigateur ignore l'image.
            <audio controls preload="metadata" src={b.src} className="mt-3 w-full">
              Votre navigateur ne lit pas cet audio.
            </audio>
          )}
        </li>
      ))}
    </ul>  );
}
