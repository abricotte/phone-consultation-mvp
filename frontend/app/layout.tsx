import type { Metadata } from "next";
import { Cormorant, Open_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({
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
  title: "Elena Wolska — Voyante sur l'Amour & Médium en Flashs Directs",
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

        <footer className="mt-24 border-t border-greige/60 bg-aubergine text-cream/80">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
            <div>
              <p className="font-serif text-xl text-white">Elena Wolska</p>
              <p className="mt-2 text-sm text-cream/70">
                Voyante sur l&apos;Amour &amp; Médium en flashs directs.
                Simplement, sans fioritures.
              </p>
            </div>
            <div className="text-sm">
              <p className="mb-3 font-medium text-white">Informations</p>
              <ul className="space-y-2 text-cream/70">
                <li><a href="/mentions-legales" className="hover:text-coral-light">Mentions légales</a></li>
                <li><a href="/cgv" className="hover:text-coral-light">Conditions générales de vente</a></li>
                <li><a href="/confidentialite" className="hover:text-coral-light">Confidentialité</a></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="mb-3 font-medium text-white">Consulter</p>
              <ul className="space-y-2 text-cream/70">
                <li><a href="/consultation-minute" className="hover:text-coral-light">Consultation Immédiate — à la minute</a></li>
                <li><a href="/consultants?formule=decouverte" className="hover:text-coral-light">Consultation Découverte — 20 min</a></li>
                <li><a href="/consultants?formule=complete" className="hover:text-coral-light">Consultation Complète — 45 min</a></li>
                <li><a href="/register" className="hover:text-coral-light">Créer un compte</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cream/10 px-5 py-5">
            <p className="mx-auto max-w-6xl text-xs text-cream/50">
              © {new Date().getFullYear()} Elena Wolska. Service de consultation
              à caractère divinatoire, réservé aux personnes majeures. Les
              consultations ne se substituent pas à un avis médical, juridique ou
              financier.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
