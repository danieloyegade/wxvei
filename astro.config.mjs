import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://danieloyegade.github.io",
  base: "/GROUND-ZERO",
  vite: {
    plugins: [tailwindcss()],
  },
});
