import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import tseslint from "typescript-eslint";

const ALLOW_UNUSED_VARNAME_PATTERN = "^_";

export default defineConfig([
  globalIgnores(["**/*.js", "**/*.d.ts", "**/*.mjs", "**/dist/**/*"]),
  {
    name: "rootJs",
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    name: "baseConfig",
    languageOptions: {
      parserOptions: {
        projectService: true,
        allowDefaultProject: ["*.js", "*.mjs"],
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      "import/no-unresolved": "off",
      "prefer-const": "error",
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "no-empty": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": [
        "error",
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      "@typescript-eslint/no-extra-semi": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: ALLOW_UNUSED_VARNAME_PATTERN,
          argsIgnorePattern: ALLOW_UNUSED_VARNAME_PATTERN,
          destructuredArrayIgnorePattern: ALLOW_UNUSED_VARNAME_PATTERN,
          caughtErrorsIgnorePattern: ALLOW_UNUSED_VARNAME_PATTERN,
        },
      ],
      eqeqeq: "error",
      "no-console": "warn",

      "import/no-dynamic-require": "warn",
      "import/order": [
        "warn",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [
            {
              pattern: "@/**",
              group: "external",
              position: "after",
            },
          ],
        },
      ],
    },
  },
]);
