import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sand / Base (배경·헤더·푸터)
        base: {
          DEFAULT: "#F5EEE4",
          light: "#FBF7F1",
        },
        border: {
          DEFAULT: "#E3D7C7",
        },
        // Sea / Accent (버튼·링크·아이콘)
        sea: {
          DEFAULT: "#12C8B2",
          deep: "#0F2B46",
          light: "#6FE3D4",
        },
        // Neutral Text
        text: {
          main: "#1B1B1B",
          sub: "#4A4F55",
        },
        muted: "#8E969E",
      },
    },
  },
  plugins: [],
};
export default config;

