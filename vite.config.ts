import path from "path";
import { defineConfig } from "vite";

const additionalHMR: RegExp = /\.wgsl$/;

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
    {
      name: "WGSL HMR",
      handleHotUpdate(ctx) {
        if (!ctx.file.match(additionalHMR)) {
          return;
        }

        ctx.server.ws.send({ type: "full-reload" });
      },
    },
  ],
  resolve: {
    alias: {
      webecs: path.resolve(__dirname, "src/index.ts"),
    },
  },
});
