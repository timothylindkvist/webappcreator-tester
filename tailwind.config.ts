import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", ...fontFamily.sans] },
      backgroundImage: {
        glam: "radial-gradient(1200px 600px at 20% -10%, rgba(255,102,244,.25), transparent 60%), radial-gradient(800px 400px at 120% 10%, rgba(75,115,255,.18), transparent 60%)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        glow: { "0%,100%": { boxShadow: "0 0 0 rgba(0,0,0,0)" }, "50%": { boxShadow: "0 0 40px rgba(178,28,255,.35)" } },
        enter: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        enter: "enter .35s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
