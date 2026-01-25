/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        invert: "var(--color-invert)",
        secondary: "var(--color-secondary)",
        background: "var(--color-background)",
        darker: "var(--color-darker)",
        text: "var(--color-text)",
        highlight: "var(--color-highlight)",
        border: "var(--color-border)",
      },
    },
  },
  plugins: [],
};
