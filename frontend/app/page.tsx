import Formules from "@/components/Formules";

export default function Home() {
  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-24 md:grid-cols-2 md:py-32">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-ivory px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-gold-dark">
              ✦ 19 ans d&apos;expérience · 20 000+ consultations
            </p>
            <h1 className="font-serif text-[44px] font-semibold leading-[1.15] text-aubergine md:text-[52px]">
              Voyante sur l&apos;Amour, médium en{" "}
              <em className="italic text-cta">flashs directs</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink">
              Médium sans support. Vous tournez en rond ? En une séance, je
              vous aide à remettre du sens. Simplement, sans fioritures.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/#formules"
                className="rounded-full bg-cta px-7 py-3.5 font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
              >
                Découvrir les formules
              </a>
              <a
                href="/consultation-minute"
                className="rounded-full border border-aubergine/25 px-7 py-3.5 font-medium text-aubergine transition hover:border-cta hover:text-cta"
              >
                Consulter maintenant
              </a>
            </div>
          </div>

          {/* Composition graphique — remplace le portrait en attendant une vraie photo */}
          <div className="flex justify-center">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-gradient-to-br from-blush via-ivory to-greige shadow-soft md:h-80 md:w-80">
              <div
                aria-hidden
                className="absolute inset-6 rounded-full bg-gradient-to-tr from-cta/10 via-transparent to-transparent"
              />
              <span aria-hidden className="font-serif text-8xl text-cta md:text-9xl">
                ✦
              </span>
              {/* Constellation discrète */}
              <span aria-hidden className="absolute left-12 top-14 text-sm text-aubergine/25 md:left-14 md:top-16">
                ✦
              </span>
              <span aria-hidden className="absolute right-14 top-10 text-[10px] text-cta/30">
                ✦
              </span>
              <span aria-hidden className="absolute right-10 top-28 text-xs text-aubergine/20">
                ✦
              </span>
              <span aria-hidden className="absolute bottom-16 left-16 text-xs text-cta/25">
                ✦
              </span>
              <span aria-hidden className="absolute bottom-24 right-16 text-sm text-aubergine/20">
                ✦
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Formules ===== */}
      <section id="formules" className="bg-blush">
        <div className="mx-auto max-w-6xl px-5 py-28">
          <div className="mb-16 text-center">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-cta">
              Elena en ligne en temps réel · Rendez-vous ou appel immédiat
            </p>
            <h2 className="font-serif text-3xl font-semibold text-aubergine">
              Trois façons de consulter Elena
            </h2>
            <p className="mt-3 leading-relaxed text-ink">
              Un besoin urgent ou une vraie mise au point : choisissez selon
              votre moment.
            </p>
          </div>
          <Formules />
        </div>
      </section>

      {/* ===== Comment ça marche ===== */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-28">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-semibold text-aubergine">
              Une consultation, en toute simplicité
            </h2>
            <p className="mt-3 leading-relaxed text-ink">Trois étapes, aucun imprévu.</p>
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
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-cta/10 font-serif text-2xl font-semibold text-prix">
                  {s.n}
                </div>
                <h3 className="font-serif text-xl font-semibold text-aubergine">
                  {s.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== À propos ===== */}
      <section className="bg-blush">
        <div className="mx-auto max-w-3xl px-5 py-28 text-center">
          <span aria-hidden className="text-3xl text-aubergine/40">
            ✦
          </span>
          <blockquote className="mt-6 font-serif text-3xl font-medium leading-snug text-aubergine">
            « Rien ne meurt, tout se transforme. Le Phénix renaît, encore et
            toujours. »
          </blockquote>
          <p className="mt-8 leading-relaxed text-ink">
            Médium sans support, en flashs directs, spécialiste des questions
            de cœur et de vie professionnelle. Une approche authentique,
            directe et bienveillante — plus de 20 000 consultations en 19
            ans.
          </p>
          <a
            href="/consultation-minute"
            className="mt-8 inline-block rounded-full bg-cta px-7 py-3.5 font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
          >
            Prendre une consultation
          </a>
        </div>
      </section>
    </div>
  );
}
