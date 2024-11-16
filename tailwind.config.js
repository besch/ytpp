/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#9333EA",
        background: "#1F2937",
        foreground: "#F9FAFB",
        muted: "#4B5563",
        card: "#374151",
        border: "#334155",
        destructive: "#DC2626",
      },
      spacing: {
        1: "0.25rem",
        2: "0.5rem",
        10: "2.5rem",
      },
      fontSize: {
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addBase, theme }) {
      addBase({
        "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active":
          {
            "-webkit-box-shadow": `0 0 0 30px ${theme(
              "colors.background"
            )} inset !important`,
            "-webkit-text-fill-color": `${theme(
              "colors.foreground"
            )} !important`,
            transition: "background-color 5000s ease-in-out 0s",
          },
      });
    },
  ],
};
