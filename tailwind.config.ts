import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" }
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#8B5CF6",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#22D3EE",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        canvas: {
          DEFAULT: "#09090B"
        },
        card: {
          DEFAULT: "#18181B",
          foreground: "#FAFAFA"
        },
        border: {
          DEFAULT: "#27272A"
        },
        muted: {
          DEFAULT: "#A1A1AA",
          foreground: "#71717A"
        },
        input: {
          DEFAULT: "#27272A"
        },
        primary: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF"
        }
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      },
      boxShadow: {
        card: "0 8px 20px rgba(0,0,0,0.3)",
        glow: "0 0 40px rgba(139, 92, 246, 0.3)",
        "glow-accent": "0 0 40px rgba(34, 211, 238, 0.3)"
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
