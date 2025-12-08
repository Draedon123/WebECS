import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "web-build",
    emptyOutDir: true,
    minify: false,
  },
  base: "/WebECS",
  publicDir: "assets",
  resolve: {
    alias: {
      webecs: path.resolve(__dirname, "src/index.ts"),
      src: path.resolve(__dirname, "src"),
    },
  },
});
