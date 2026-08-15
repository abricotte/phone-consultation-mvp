import type { Metadata } from "next";
import { Cormorant, Open_Sans, Plus_Jakarta_Sans } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

// Cormorant en casse normale — les petites capitales ne survivent
// que sur les micro-étiquettes (eyebrows), en sans-serif.
const cormorant = Cormorant({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-opensans",
  display: "swap",
});

// Sans moderne de l'espace cliente (chiffres élégants, ton produit) —
// appliquée via la classe `font-jakarta` sur les pages de l'espace.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
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
    <html lang="fr" className={`${cormorant.variable} ${openSans.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream">
        <SiteHeader />

        <main className="flex-1">{children}</main>

        {/* Footer aligné sur la structure et le ton d'elena-wolska.com */}
        <footer className="mt-24 bg-footer text-white/80">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:grid-cols-3">
            <div>
              {/* Même traitement que le pied de page du site officiel :
                  le logo passé en blanc sur le fond sombre. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/elena-wolska-logo.png"
                alt="Elena Wolska"
                width={200}
                height={71}
                className="mb-3 h-16 w-auto brightness-0 invert"
              />
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Voyante sur l&apos;Amour et Médium sans Support, en Flashs
                Directs. 19 ans d&apos;expérience. 20&nbsp;000+ consultations.
              </p>
              <a
                href="https://elena-wolska.com"
                className="mt-4 inline-block text-sm text-white/50 transition-colors hover:text-white"
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
