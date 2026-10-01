import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15263b",
        muted: "#66758a",
        line: "#e7ebf0",
        brand: "#4067e8",
        mint: "#b9f2d1"
      },
      boxShadow: {
        card: "0 20px 55px rgba(22, 39, 66, 0.08)",
        soft: "0 8px 26px rgba(22, 39, 66, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
