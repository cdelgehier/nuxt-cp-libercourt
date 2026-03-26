// ESLint configuration for Nuxt 3 project
// This file configures code quality rules for TypeScript and Vue files

import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  features: {
    typescript: true,
    vue: true,
    stylistic: false,
  },
}).append(
  // Rules applied to all files
  {
    rules: {
      // console.warn/error OK partout ; console.log interdit côté front
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "vue/html-self-closing": [
        "error",
        {
          html: { void: "any", normal: "always", component: "always" },
          svg: "always",
          math: "always",
        },
      ],
      "vue/require-default-prop": "error",
      "vue/multi-word-component-names": [
        "error",
        {
          ignores: [
            "default",
            "index",
            "admin",
            "club",
            "contact",
            "faq",
            "calendrier",
            "actualites",
            "equipes",
            "licencies",
            "login",
          ],
        },
      ],
    },
  },
  // Nitro server : console est le logger standard, any OK pour le parsing XML
  {
    files: ["server/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  // SmartPing : parsing XML untyped — any inévitable
  {
    files: [
      "server/domains/competition/smartping/client.ts",
      "server/utils/smartping.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
