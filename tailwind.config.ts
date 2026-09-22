import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /** Azul marinho profundo — capa do livro */
        "book-blue": "#0F1C2E",
        /** Azul levemente mais claro — cards da biblioteca */
        "book-blue-light": "#1A2D45",
        /** Dourado envelhecido — títulos, bordas e ornamentos */
        "book-gold": "#C9A84C",
        /** Pergaminho — fundos claros / páginas */
        "book-paper": "#F3E8D4",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-lora)", "Georgia", "serif"],
      },
      keyframes: {
        "drawer-in": {
          from: { transform: "translateX(100%)", opacity: "0.6" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "drawer-in": "drawer-in 0.28s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
