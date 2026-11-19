import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "chrome106",
    rollupOptions: {
      input: { popup: "index.html", settings: "settings.html", background: "src/background/index.ts" },
      output: {
        entryFileNames: (chunk) => chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
      },
    },
  },
});
