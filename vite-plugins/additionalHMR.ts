import type { PluginOption } from "vite";

function additionalHMR(regexp: RegExp): PluginOption {
  return {
    name: "Additional HMR",
    handleHotUpdate(ctx) {
      if (!ctx.file.match(regexp)) {
        return;
      }

      ctx.server.ws.send({ type: "full-reload" });
    },
  };
}

export { additionalHMR };
