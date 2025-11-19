import path from "path";
import { defineConfig } from "vite";

const additionalHMR: RegExp = /\.wgsl$/;

export default defineConfig({
  build: {
    target: "esnext",
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
