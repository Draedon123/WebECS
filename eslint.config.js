// @ts-check

import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  js.configs.recommended,
  ...ts.configs.strict,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": 0,
    },
  },
  {
    files: ["**/*.ts"],
  },
  {
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": 0,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ["web-build/", "dist/"],
  },
];
