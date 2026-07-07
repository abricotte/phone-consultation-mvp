import Formules from "@/components/Formules";

export default function Home() {
  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="bg-warm">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-ivory px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-gold-dark">
              ✦ 19 ans d&apos;expérience · 20 000+ consultations
            </p>
            <h1 className="font-serif text-5xl font-semibold leading-tight text-aubergine md:text-6xl">
              Voyante sur l&apos;Amour
              <span className="block text-coral">&amp; Médium sans support, en flashs directs</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink/75">
              Vous tournez en rond ? En une séance, je vous aide à remettre du
              sens. Simplement, sans fioritures.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/#formules"
                className="rounded-full bg-coral px-7 py-3.5 font-medium text-white shadow-card transition hover:bg-coral-dark"
              >
                Découvrir les formules
              </a>
              <a
                href="/consultation-minute"
                className="rounded-full border border-aubergine/25 px-7 py-3.5 font-medium text-aubergine transition hover:border-coral hover:text-coral"
              >
                Consulter maintenant
              </a>
            </div>
          </div>

          {/* Portrait — à remplacer par la vraie photo d'Elena */}
          <div className="flex justify-center">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-gradient-to-br from-blush via-ivory to-greige shadow-soft md:h-80 md:w-80">
              <span aria-hidden className="font-serif text-7xl text-coral/60">
                ✦
              </span>
              <span className="absolute -bottom-3 rounded-full border border-greige/70 bg-ivory px-4 py-1.5 text-xs font-medium text-ink/60">
                Photo d&apos;Elena
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Comment ça marche ===== */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-14 text-center">
          <h2 className="font-serif text-4xl font-semibold text-aubergine">
            Une consultation, en toute simplicité
          </h2>
          <p className="mt-3 text-ink/70">Trois étapes, aucun imprévu.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Choisissez votre formule",
              d: "Découverte, Complète ou à la minute — vous savez exactement ce que vous payez.",
            },
            {
              n: "2",
              t: "Réglez en toute sécurité",
              d: "Paiement par carte sécurisé. Aucune surprise, aucun dépassement.",
            },
            {
              n: "3",
              t: "Elena vous appelle",
              d: "Vous êtes rappelée sur votre téléphone. Un rappel discret vous prévient avant la fin.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-greige/60 bg-ivory p-8 text-center"
            >
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 font-serif text-2xl font-semibold text-coral">
                {s.n}
              </div>
              <h3 className="font-serif text-xl font-semibold text-aubergine">
                {s.t}
              </h3>
              <p className="mt-2 text-sm text-ink/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Formules ===== */}
      <section id="formules" className="bg-warm">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold-dark">
              Elena en ligne en temps réel · Rendez-vous ou appel immédiat
            </p>
            <h2 className="font-serif text-4xl font-semibold text-aubergine">
              Trois façons de consulter Elena
            </h2>
            <p className="mt-3 text-ink/70">
              Un besoin urgent ou une vraie mise au point : choisissez selon
              votre moment.
            </p>
          </div>
          <Formules />
        </div>
      </section>

      {/* ===== À propos ===== */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <span aria-hidden className="text-3xl text-coral">
          ✦
        </span>
        <blockquote className="mt-6 font-serif text-3xl font-medium leading-snug text-aubergine">
          « Rien ne meurt, tout se transforme. Le Phénix renaît, encore et
          toujours. »
        </blockquote>
        <p className="mt-8 text-ink/75">
          Médium sans support, en flashs directs, spécialiste des questions de
          cœur et de vie professionnelle. Une approche authentique, directe et
          bienveillante — plus de 20 000 consultations en 19 ans.
        </p>
        <a
          href="/consultation-minute"
          className="mt-8 inline-block rounded-full bg-coral px-7 py-3.5 font-medium text-white shadow-card transition hover:bg-coral-dark"
        >
          Prendre une consultation
        </a>
      </section>
    </div>
  );
}
