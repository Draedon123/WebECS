import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "web-build",
    emptyOutDir: true,
    minify: true,
    terserOptions: {
      compress: {
        booleans_as_integers: true,
        ecma: 2020,
        expression: true,
        keep_fargs: false,
        module: true,
        toplevel: true,
        passes: 3,
        unsafe: true,
      },
      mangle: {
        module: true,
        toplevel: true,
      },
      format: {
        comments: false,
        indent_level: 0,
      },
    },
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
