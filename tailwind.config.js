/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#9333EA",
        accent: "#059669",
        background: "#1F2937",
        foreground: "#F9FAFB",
        muted: "#4B5563",
        "muted-foreground": "#9CA3AF",
        card: "#374151",
        border: "#334155",
        destructive: "#DC2626",
      },
      spacing: {
        1: "0.25rem",
        2: "0.5rem",
        10: "2.5rem",
        // added more spacing options
        4: "1rem",
        6: "1.5rem",
        8: "2rem",
        12: "3rem",
      },
      fontSize: {
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        // added larger font sizes
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      borderRadius: {
        // added custom border radius
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
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
