import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06070d",
        cyanPulse: "#00e5d4",
        magentaPulse: "#ff5a70",
        limePulse: "#18c7a1",
        amberPulse: "#ffd166"
      },
      boxShadow: {
        glow: "0 0 40px rgba(0, 229, 212, 0.2)",
        magenta: "0 0 34px rgba(255, 90, 112, 0.2)"
      }
    }
  },
  plugins: []
};

export default config;
