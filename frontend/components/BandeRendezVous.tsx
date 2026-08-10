// Bande « Prendre rendez-vous » — le moment le plus designé de la page.
// Reprend le motif des maquettes d'Elena : dégradé violet profond,
// vagues en SVG et lueur corail dans un angle. Elle donne au parcours
// Calendly la place qu'un simple lien ne lui donnait pas.
//
// Composant serveur : aucun état, aucune interaction — inutile de
// l'envoyer au navigateur.

const FORMULES = [
  {
    nom: "Découverte",
    duree: "20 minutes",
    prix: "58 €",
    detail: "Une question précise, une réponse claire.",
  },
  {
    nom: "Complète",
    duree: "45 minutes",
    prix: "129 €",
    detail: "Le temps d'explorer en profondeur, sans regarder l'horloge.",
    misEnAvant: true,
  },
];

export default function BandeRendezVous() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3D3160] via-aubergine to-[#4A3A75]">
      {/* Vague haute */}
      <svg
        className="pointer-events-none absolute left-0 top-[-1px] block h-16 w-full sm:h-24"
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,62 C230,102 470,16 750,40 C1000,61 1240,6 1440,48 L1440,0 L0,0 Z"
          className="fill-cream"
        />
      </svg>

      {/* Lueur corail, discrète, dans un angle */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(228,106,93,0.55), transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-5 pb-28 pt-32 sm:pt-36">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-coral-light">
            Sur rendez-vous
          </p>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-white sm:text-4xl">
            Choisissez votre moment
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/70">
            Vous n&apos;avez pas à attendre qu&apos;Elena soit en ligne : réservez
            le créneau qui vous convient, et c&apos;est elle qui vous appelle à
            l&apos;heure dite.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          {FORMULES.map((f) => (
            <div
              key={f.nom}
              className={`rounded-3xl p-7 text-center backdrop-blur-sm transition ${
                f.misEnAvant
                  ? "bg-white/[0.12] ring-1 ring-coral-light/40"
                  : "bg-white/[0.07] ring-1 ring-white/10"
              }`}
            >
              <h3 className="font-serif text-2xl font-semibold text-white">
                {f.nom}
              </h3>
              <p className="mt-1 text-sm text-white/60">{f.duree}</p>
              <p className="mt-4 font-serif text-4xl font-semibold text-coral-light">
                {f.prix}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                {f.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="https://elena-wolska.com/disponibilites"
            className="inline-block rounded-full bg-cta px-9 py-4 font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
          >
            Voir les créneaux disponibles →
          </a>
          <p className="mt-5 text-sm text-white/50">
            Réservation et paiement sécurisés · Elena vous appelle à l&apos;heure
            choisie
          </p>
        </div>
      </div>

      {/* Vague basse */}
      <svg
        className="pointer-events-none absolute bottom-[-1px] left-0 block h-16 w-full rotate-180 sm:h-24"
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,62 C230,102 470,16 750,40 C1000,61 1240,6 1440,48 L1440,0 L0,0 Z"
          className="fill-blush"
        />
      </svg>
    </section>
  );
}
