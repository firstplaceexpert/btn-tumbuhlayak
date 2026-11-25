/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official btn.co.id 2024-2026 Rebrand Palette
        frame: "#F3F6FB",
        sheet: "#FFFFFF",
        well: "#F7F9FD",
        active: "#EAF1FF",
        hairline: "#E3E9F4",
        rule: "#EDF1F8",
        control: "#CBD5E6",
        ink: {
          DEFAULT: "#0F172A",
          secondary: "#475569",
          subtle: "#64748B",
        },
        // Primary: BTN Dynamic Blue (#125EFA)
        brand: {
          DEFAULT: "#125EFA",
          deep: "#0B46C4",
          navy: "#082D7F",
          hover: "#0E4FD6",
          soft: "#EDF3FF",
          border: "#C3D7FE",
        },
        // Signature Accent: BTN Stable Red (#DC0714)
        btnred: {
          DEFAULT: "#DC0714",
          hover: "#B80510",
          soft: "#FEF0F1",
          border: "#F9C5C8",
        },
        // Semantic & Phase accents
        ochre: {
          DEFAULT: "#9A5B08",
          mid: "#C47D0E",
          gold: "#F5B82E",
          soft: "#FEF6E4",
          border: "#F3D9A4",
        },
        tealarch: {
          DEFAULT: "#0E7490",
          soft: "#ECFAFD",
          border: "#BAE6F2",
        },
        positive: {
          DEFAULT: "#0E8345",
          soft: "#EAF8F0",
          border: "#BBE6CE",
        },
        negative: {
          DEFAULT: "#DC0714",
          soft: "#FEF0F1",
          border: "#F9C5C8",
        },
      },
      fontFamily: {
        display: ['"Poppins"', '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', '"Poppins"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sheet: "16px",
        card: "12px",
        control: "8px",
      },
    },
  },
  plugins: [],
};
