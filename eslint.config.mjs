import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import typescriptEslint from "typescript-eslint";

export default [
  ...typescriptEslint.config(
    js.configs.recommended,
    typescriptEslint.configs.recommended
  ),
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-function": "off",
      "no-empty": "warn",
      "@typescript-eslint/no-extra-semi": "off",
      "@typescript-eslint/no-explicit-any": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      eqeqeq: "error",
      "prefer-const": "error",

      "import/order": [
        "warn",
        {
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
