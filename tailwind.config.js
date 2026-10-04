/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}", "./public/assets/js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#7086BD",
        secondary: "#435071",
        tertiary: "#E2E6F1",
        danger: "#EB2323",
        info: "#237AEB",
        success: "#28B84A",
        text: "#333333",
        white: "#FFFFFF",
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-alt": "rgb(var(--surface-alt) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "control-border": "rgb(var(--control-border) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        link: "rgb(var(--link) / <alpha-value>)",
        "on-primary": "#FFFFFF"
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "sans-serif"]
      },
      boxShadow: { panel: "0 2px 6px rgb(15 23 42 / 0.03)" }
    }
  },
  plugins: []
};
