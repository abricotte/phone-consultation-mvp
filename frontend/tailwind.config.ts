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
        aubergine: "#3D2C3E", // titres (serif) — 12,3:1 sur crème
        footer: "#2b3a52", // fond du footer — bleu nuit réel du site prod (distinct des titres)
        cream: "#FDF9F3", // fond de page
        ivory: "#FFFFFF", // cartes
        blush: "#FDF2F0", // corail très pâle
        greige: "#EAD9CC", // bordures
        ink: "#5C4B42", // texte courant — 7,9:1 sur crème
        mention: "#8A7568", // mentions/microcopie (labels, légendes)
        "mention-light": "#A08D80", // mentions secondaires (états de chargement)
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
