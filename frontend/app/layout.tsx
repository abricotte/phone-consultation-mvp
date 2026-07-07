import type { Metadata } from "next";
import { Cormorant_SC, Open_Sans } from "next/font/google";
import "./globals.css";

// Cormorant SC (petites capitales) — police des titres du site prod
const cormorant = Cormorant_SC({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-opensans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elena Wolska — Voyante sur l'Amour & Médium sans Support, en Flashs Directs",
  description:
    "Consultations de voyance par téléphone avec Elena Wolska. Formules claires, paiement sécurisé, échange confidentiel. Simplement, sans fioritures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${openSans.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream">
        <header className="sticky top-0 z-50 border-b border-greige/60 bg-cream/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <a href="/" className="flex items-center gap-2.5">
              <span aria-hidden className="text-2xl leading-none text-coral">
                ✦
              </span>
              <span className="font-serif text-2xl font-semibold tracking-wide text-aubergine">
                Elena&nbsp;Wolska
              </span>
            </a>
            <nav className="flex items-center gap-6 text-sm">
              <a href="/#formules" className="hidden text-ink/70 transition hover:text-coral sm:inline">
                Formules
              </a>
              <a href="/consultation-minute" className="hidden text-ink/70 transition hover:text-coral sm:inline">
                Appeler maintenant
              </a>
              <a href="/dashboard" className="text-ink/70 transition hover:text-coral">
                Mon espace
              </a>
              <a
                href="/login"
                className="rounded-full bg-coral px-5 py-2 font-medium text-white shadow-card transition hover:bg-coral-dark"
              >
                Connexion
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Footer aligné sur la structure et le ton d'elena-wolska.com */}
        <footer className="mt-24 bg-aubergine text-white/80">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:grid-cols-3">
            <div>
              <p className="font-serif text-xl text-white">Elena Wolska</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Voyante sur l&apos;Amour et Médium sans Support, en Flashs
                Directs. 19 ans d&apos;expérience. 20&nbsp;000+ consultations.
              </p>
              <a
                href="https://elena-wolska.com"
                className="mt-4 inline-block text-sm text-white/50 transition-colors hover:text-coral-light"
              >
                elena-wolska.com →
              </a>
            </div>
            <div className="text-sm">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Consultations
              </h4>
              <ul className="space-y-2">
                <li><a href="/consultation-minute" className="text-white/50 transition-colors hover:text-white">Consultation Immédiate — à la minute</a></li>
                <li><a href="https://elena-wolska.com/disponibilites" className="text-white/50 transition-colors hover:text-white">Consultation Découverte — 20 min</a></li>
                <li><a href="https://elena-wolska.com/disponibilites" className="text-white/50 transition-colors hover:text-white">Consultation Complète — 45 min</a></li>
                <li><a href="/register" className="text-white/50 transition-colors hover:text-white">Créer un compte</a></li>
              </ul>
            </div>
            <div className="text-sm">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                À propos
              </h4>
              <ul className="space-y-2">
                <li><a href="https://elena-wolska.com/a-propos" className="text-white/50 transition-colors hover:text-white">Mon parcours</a></li>
                <li><a href="https://elena-wolska.com/temoignages" className="text-white/50 transition-colors hover:text-white">Témoignages</a></li>
                <li><a href="https://elena-wolska.com/ressources-gratuites" className="text-white/50 transition-colors hover:text-white">Ressources gratuites</a></li>
                <li><a href="https://elena-wolska.com/contact" className="text-white/50 transition-colors hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>

          <p className="px-5 pb-6 text-center text-xs italic leading-relaxed text-white/40">
            Rien ne meurt, tout se transforme.
            <br />
            Le Phénix renaît, encore et toujours.
          </p>

          <div className="border-t border-white/10 px-5 py-5">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-white/30 md:flex-row">
              <p>
                © {new Date().getFullYear()} Elena Wolska — Voyance &amp;
                Consultation en flashs directs. Réservé aux personnes majeures.
              </p>
              <div className="flex gap-4">
                <a href="https://elena-wolska.com/mentions-legales" className="transition-colors hover:text-white/60">Mentions légales</a>
                <a href="https://elena-wolska.com/cgv" className="transition-colors hover:text-white/60">CGV</a>
                <a href="https://elena-wolska.com/confidentialite" className="transition-colors hover:text-white/60">Confidentialité</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
