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
        // Hiérarchie renforcée (maquette validée) — la couleur ne touche
        // QUE : prix, CTA, badge, point de statut
        cta: {
          DEFAULT: "#C24818", // corail saturé #C94F1D assombri d'un cran → contraste AA 4,6:1 avec le texte crème
          dark: "#A83D13", // hover
          text: "#FFF6EF",
        },
        prix: "#B0430F", // corail profond (prix) — 5,4:1 sur crème
        gold: {
          light: "#d8c199",
          DEFAULT: "#c9a96e",
          dark: "#8a6f3e",
        },
        // Alignement sur elena-wolska.com (sources prod, 2026-07-07)
        aubergine: "#2b3a52", // titres & footer — "primary" bleu nuit du site prod
        cream: "#fcf9f1", // fond chaleureux principal (= site-bg prod)
        ivory: "#fffaf8", // fond clair (cartes)
        blush: "#FDF2F0", // corail très pâle (= accent.subtle prod)
        greige: "#e0d5cc", // bordures douces (= border-light prod)
        ink: "#4a4a4a", // texte courant (= secondary prod)
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-opensans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 14px 40px -18px rgba(61, 28, 84, 0.20)",
        card: "0 6px 24px -12px rgba(196, 102, 88, 0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
