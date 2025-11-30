/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        // Club colors based on logo
        club: {
          yellow: "#FFD700",
          gold: "#FFD700",
          green: "#20B2AA",
          blue: "#1e40af", // Bleu pour les liens et actions
          red: "#DC143C",
          navy: "#1e293b",
          white: "#FFFFFF",
        },
        // Extended palette for design
        primary: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#FFD700", // Club yellow
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
          950: "#422006",
        },
        secondary: {
          50: "#e0f2f1",
          100: "#b2dfdb",
          200: "#80cbc4",
          300: "#4db6ac",
          400: "#26a69a",
          500: "#20B2AA", // Club green
          600: "#00897b",
          700: "#00695c",
          800: "#004d40",
          900: "#00251a",
        },
        accent: {
          50: "#fce4ec",
          100: "#f8bbd9",
          200: "#f48fb1",
          300: "#f06292",
          400: "#ec407a",
          500: "#DC143C", // Club red
          600: "#c2185b",
          700: "#ad1457",
          800: "#880e4f",
          900: "#560027",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": [
          "4.5rem",
          { lineHeight: "1.1", letterSpacing: "-0.025em" },
        ],
        "display-lg": [
          "3.75rem",
          { lineHeight: "1.1", letterSpacing: "-0.025em" },
        ],
        "display-md": [
          "3rem",
          { lineHeight: "1.2", letterSpacing: "-0.025em" },
        ],
        "display-sm": [
          "2.25rem",
          { lineHeight: "1.3", letterSpacing: "-0.025em" },
        ],
      },
      animation: {
        "ping-pong": "bounce 1s infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "infinite-scroll": "infinite-scroll 25s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "infinite-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
      },
      boxShadow: {
        club: "0 4px 14px 0 rgba(255, 215, 0, 0.2)",
        "club-lg": "0 10px 25px 0 rgba(255, 215, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
