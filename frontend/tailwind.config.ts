import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identité Elena Wolska (extraite de elena-wolska.com)
        coral: {
          light: "#e8857b",
          DEFAULT: "#e46a5d", // accents décoratifs (puces, liens)
          dark: "#c26658",
        },
        // Palette assombrie (validée 2026-07-07) — la couleur ne touche
        // QUE : prix, CTA, badge, point de statut
        cta: {
          DEFAULT: "#C24818", // CTA plein — 4,6:1 avec le texte crème
          dark: "#A83D13", // hover
          text: "#FFF6EF",
          outline: "#D89B7E", // bordure du CTA contour (texte en `prix`)
        },
        prix: "#B0430F", // 5,5:1 sur fond crème/blanc
        recommended: "#C94F1D", // bordure 1,5px de la carte "Recommandée" (distinct du CTA)
        gold: {
          light: "#d8c199",
          DEFAULT: "#c9a96e",
          dark: "#8a6f3e",
        },
        aubergine: "#232B45", // titres (serif) — bleu nuit dense, 13,3:1 sur crème
        footer: "#232B45", // fond du footer — unifié avec les titres
        cream: "#FDF9F3", // fond de page
        ivory: "#FFFFFF", // cartes
        blush: "#FAF0EA", // blush rosé léger — alternance de sections
        greige: "#EAD9CC", // bordures
        ink: "#4A3B33", // texte courant — 10,2:1 sur crème (lisibilité)
        mention: "#7c695e", // mentions/microcopie — AA 4,5:1+ sur crème/blush/blanc
        statut: {
          online: "#3B6D11", // texte + point "en ligne"
          offline: "#B4B2A9", // point "hors ligne" (label en `mention`)
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-opensans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 14px 40px -18px rgba(61, 44, 62, 0.20)",
        card: "0 6px 24px -12px rgba(196, 72, 24, 0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
