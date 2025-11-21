import fs from "fs";
import path from "path";

import type { PluginOption, ResolvedConfig } from "vite";

function assetExcluder(directories: string[]): PluginOption {
  let config: ResolvedConfig;

  return {
    name: "Exclude Assets",
    closeBundle(error) {
      if (error instanceof Error) {
        return;
      }

      const outDirectory = config.build.outDir;

      for (const _directory of directories) {
        const directory = path.resolve(
          __dirname,
          "../",
          outDirectory,
          _directory
        );

        if (!fs.existsSync(directory)) {
          console.warn(`\nCould not find directory ${_directory} to exclude`);
          continue;
        }

        fs.rmSync(directory, { recursive: true, force: true });
      }
    },
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
  };
}

export { assetExcluder };
