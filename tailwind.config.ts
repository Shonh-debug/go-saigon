import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050816",
        cyanPulse: "#16d9ff",
        magentaPulse: "#ff3bbd",
        limePulse: "#82f52c",
        amberPulse: "#ffb020"
      },
      boxShadow: {
        glow: "0 0 40px rgba(22, 217, 255, 0.18)",
        magenta: "0 0 34px rgba(255, 59, 189, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
