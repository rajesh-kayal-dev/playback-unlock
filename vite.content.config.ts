import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    target: "chrome106",
    emptyOutDir: false,
    lib: {
      entry: "src/content/index.ts",
      name: "PlaybackUnlock",
      formats: ["iife"],
      fileName: () => "content.js",
    },
  },
});
