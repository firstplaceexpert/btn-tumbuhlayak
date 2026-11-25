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
        // Calm Warm-Paper Palette paired with refined BTN Royal Blue & Crimson (low glare)
        frame: "#F4F2ED",
        sheet: "#FCFBF8",
        well: "#F6F4EF",
        active: "#EEF3FC",
        hairline: "#E7E3DB",
        rule: "#EFECE6",
        control: "#D4CFC5",
        ink: {
          DEFAULT: "#1F242B",
          secondary: "#57606D",
          subtle: "#7A828F",
        },
        // Primary: Refined BTN Royal Blue
        brand: {
          DEFAULT: "#1B56C6",
          deep: "#163F92",
          navy: "#0F2D6B",
          hover: "#1646A5",
          soft: "#EEF3FC",
          border: "#CBD9F6",
        },
        // Signature Accent: Refined BTN Crimson
        btnred: {
          DEFAULT: "#C4252E",
          hover: "#A51D25",
          soft: "#FDF2F2",
          border: "#F4CCCC",
        },
        // Semantic & Phase accents
        ochre: {
          DEFAULT: "#9E6316",
          mid: "#C27D20",
          gold: "#E8B13B",
          soft: "#FCF5E8",
          border: "#EEDCB8",
        },
        tealarch: {
          DEFAULT: "#176B7E",
          soft: "#EDF8FA",
          border: "#C3E3EA",
        },
        positive: {
          DEFAULT: "#1D7A4E",
          soft: "#EEF8F2",
          border: "#C5E6D3",
        },
        negative: {
          DEFAULT: "#C4252E",
          soft: "#FDF2F2",
          border: "#F4CCCC",
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
