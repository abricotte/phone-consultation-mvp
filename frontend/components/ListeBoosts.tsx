// LES PETITES CLEFS D'ELENA (nom choisi par Elena le 16 octobre ; on disait « les boosts ») — La Minute Voyance, saison 2 : quelques minutes de la voix
// d'Elena autour d'une réflexion qui ouvre une perspective, bouscule une
// certitude ou apaise. Partagé par Apprendre (en écoutant) et le petit salon.

// Les boosts : un fichier audio par boost (fourni par Elena, dans
// public/audio/boosts), sa durée ; sans fichier, le boost est « bientôt ».
type Boost = { titre: string; src?: string; duree?: string; semaine?: boolean };
// Trois boosts gardés (Elena, 16 octobre). Mis de côté, à reprendre plus
// tard : « Avant de lui écrire », « Après une rupture ».
export const BOOSTS: Boost[] = [
  // semaine : la petite clef mise en avant dans le salon (une seule)
  { titre: "La vulnérabilité, c'est beau aussi", src: "/audio/boosts/la-vulnerabilite.mp4", duree: "2 min 37", semaine: true },
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

/** La petite clef de la semaine, pour le salon : une seule, avec son lecteur.
 *  Celle marquée « semaine », sinon la première enregistrée. */
export function ClefDeLaSemaine() {
  const b = BOOSTS.find((x) => x.semaine && x.src) ?? BOOSTS.find((x) => x.src);
  if (!b) return null;
  return (
    <section className="rounded-[24px] border border-[#F2B3CB] bg-[#FDF0F5] p-5 md:p-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#A3245A]">La petite clef de la semaine</p>
      <p className="mt-1 font-serif text-[26px] font-semibold leading-tight text-aubergine">{b.titre}</p>
      {b.duree && <p className="text-[13px] text-mention">{b.duree} · la voix d&apos;Elena</p>}
      {/* Un mp4 avec une piste audio se lit dans <audio> : le navigateur ignore l'image. */}
      <audio controls preload="metadata" src={b.src} className="mt-3 w-full">
        Votre navigateur ne lit pas cet audio.
      </audio>
      <a href="/apprendre?onglet=ecouter&saison=2" className="mt-3 inline-block text-[13px] font-semibold text-prix hover:underline">
        Toutes les petites clefs, dans Apprendre →
      </a>
    </section>
  );
}
