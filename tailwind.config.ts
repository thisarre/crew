import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#16161B",
        sage: "#DAF4AA",
        mint: "#96D8D0",
        lilac: "#D2B4F1",
        bg: "#F4F4F2",
        "bg-soft": "#DDDDDA",
        "text-secondary": "#6B6B6F",
        "text-muted": "#9C9CA0",
        border: "#DDDDDA",
        "border-soft": "#EEEEEC",
        "error-bg": "#FCEBEB",
        "error-fg": "#A32D2D",
        "warning-bg": "#FAEEDA",
        "warning-fg": "#854F0B",
      },
      spacing: {
        3.5: "14px",
        4.5: "18px",
        5.5: "22px",
        7.5: "30px",
      },
      borderRadius: {
        xs: "8px",
        sm: "10px",
        md: "12px",
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
        "3xl": "28px",
        pill: "100px",
      },
      fontFamily: {
        sans: ["var(--font-primary)", "system-ui", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        pulseDot: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "50%": { transform: "scale(1.2)", opacity: 0.7 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-dot": "pulseDot 3s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 36px rgba(218, 244, 170, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
