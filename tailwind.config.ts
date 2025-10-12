import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" }
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7C3AED",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#06B6D4",
        },
        canvas: {
          DEFAULT: "#0b0f19"
        }
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      },
      boxShadow: {
        card: "0 8px 20px rgba(0,0,0,0.06)"
      }
    },
  },
  plugins: [],
}
export default config
