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
          DEFAULT: "#e46a5d", // couleur principale (boutons, accents)
          dark: "#c26658",
        },
        gold: {
          light: "#d8c199",
          DEFAULT: "#c9a96e",
          dark: "#8a6f3e",
        },
        aubergine: "#3d1c54", // accent profond
        cream: "#fcf9f1", // fond chaleureux principal
        ivory: "#fffaf8", // fond clair (cartes)
        blush: "#fff7f4", // rose très pâle
        greige: "#e0d5cc", // bordures douces
        ink: "#4a4a4a", // texte courant
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
