import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules", "dev/dist", "src/icons.generated.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: { console: "readonly", process: "readonly", URL: "readonly" } },
  },
  {
    files: ["dev/**/*.js"],
    languageOptions: {
      globals: {
        console: "readonly",
        document: "readonly",
        location: "readonly",
        setTimeout: "readonly",
        URLSearchParams: "readonly",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
