export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <span aria-hidden className="text-3xl text-aubergine/40">
        ✦
      </span>
      <h1 className="mt-4 font-serif text-4xl font-semibold text-aubergine">
        Page introuvable
      </h1>
      <p className="mt-3 text-ink">
        Cette page n&apos;existe pas ou n&apos;existe plus.
      </p>
      <a
        href="/"
        className="mt-8 inline-block rounded-full bg-cta px-7 py-3 font-medium text-cta-text shadow-card transition hover:bg-cta-dark"
      >
        Retour à l&apos;accueil
      </a>
    </div>
  );
}
