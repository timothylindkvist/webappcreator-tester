import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0C",
        card: "rgba(255,255,255,0.05)"
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.10)"
      },
      boxShadow: {
        glass: "0 8px 30px rgba(79,70,229,0.35)"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem"
      }
    }
  },
  plugins: []
} satisfies Config;
