import path from "path";
import { defineConfig } from "vite";
import { additionalHMR } from "./vite-plugins/additionalHMR";
import { assetExcluder } from "./vite-plugins/assetExcluder";

const ADDITIONAL_HMR_REGEXP: RegExp = /\.wgsl$/;
const EXCLUDE_DIRECTORIES: string[] = ["web-assets"];

export default defineConfig({
  build: {
    target: "esnext",
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "WebECS",
      fileName: "webecs",
    },
  },
  base: "/WebECS",
  publicDir: "assets",
  plugins: [
    additionalHMR(ADDITIONAL_HMR_REGEXP),
    assetExcluder(EXCLUDE_DIRECTORIES),
  ],
  resolve: {
    alias: {
      webecs: path.resolve(__dirname, "src/index.ts"),
      src: path.resolve(__dirname, "src"),
    },
  },
});
