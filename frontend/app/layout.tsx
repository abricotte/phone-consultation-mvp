import type { Metadata } from "next";
import { Cormorant, Open_Sans, Plus_Jakarta_Sans } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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

        <SiteFooter />
      </body>
    </html>
  );
}
