// ORNEMENTS DE L'ESPACE — les petites choses qui font la douceur, pour
// qu'elles soient les mêmes partout : le filet doré entre deux chapitres,
// l'éventail de cartes, les pilules d'un menu horizontal.

/** Un filet doré avec ✦ au milieu — entre deux chapitres d'une page */
export function Filet() {
  return (
    <div className="my-10 flex items-center gap-4" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
      <span className="text-gold">✦</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  );
}

/** Trois cartes en éventail — l'objet, pas une icône */
export function Eventail({ images, taille = 150 }: { images: string[]; taille?: number }) {
  const angles = [-12, 0, 12];
  return (
    <div
      className="relative mx-auto flex items-end justify-center"
      // Les cartes sont plus hautes que larges (480 × 823) : la hauteur doit
      // les contenir, rotation et décalage compris, sinon le haut est rogné.
      style={{ height: taille * 1.9, width: taille * 2.1 }}
    >
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          style={{
            width: taille,
            transform: `rotate(${angles[i]}deg) translateY(${i === 1 ? -12 : 0}px)`,
            transformOrigin: "bottom center",
            zIndex: i === 1 ? 2 : 1,
            marginLeft: i ? -taille * 0.45 : 0,
          }}
          className="rounded-xl shadow-[0_18px_40px_-18px_rgba(35,43,69,0.45)] ring-1 ring-white/60"
        />
      ))}
    </div>
  );
}

/** Les pilules d'un menu horizontal, comme les onglets d'un carnet */
export function Pilules<T extends string>({
  valeur,
  onChange,
  options,
  label,
}: {
  valeur: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="mb-8 flex flex-wrap gap-1 rounded-full border border-greige/70 bg-ivory p-1 md:inline-flex"
    >
      {options.map(([k, l]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          aria-current={valeur === k ? "page" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            valeur === k
              ? "bg-aubergine text-cream shadow-card"
              : "text-mention hover:bg-blush hover:text-aubergine"
          }`}
        >
          {l}
        </button>
      ))}
    </nav>
  );
}

/** « Bientôt » — une pièce pas encore meublée, mais qui dit ce qui vient */
export function Bientot({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-[13px] font-semibold text-gold-dark">
      <span aria-hidden>✦</span>
      {children}
    </p>
  );
}
