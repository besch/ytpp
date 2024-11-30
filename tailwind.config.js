/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  important: "#timeline-container, #react-overlay-root",
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
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      borderRadius: {
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
        "#timeline-container, #react-overlay-root": {
          "--tw-shadow": "none",
          "--tw-ring-shadow": "none",
        },
        "#timeline-container button, #react-overlay-root button": {
          background: "transparent",
          border: "none",
          padding: "0.5rem 1rem",
          "font-weight": "500",
          "border-radius": "0.375rem",
          cursor: "pointer",
          transition: "background-color 200ms",
          "&:hover": {
            "background-color": "rgba(255, 255, 255, 0.1)",
          },
        },
        "#timeline-container *, #react-overlay-root *": {
          "box-sizing": "border-box",
        },
        "#react-overlay-root [role='button']": {
          cursor: "move",
          "user-select": "none",
          "-webkit-user-select": "none",
        },
      });
    },
  ],
  corePlugins: {
    preflight: true,
  },
};
