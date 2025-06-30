// ESLint configuration for Nuxt 3 project
// This file configures code quality rules for TypeScript and Vue files

import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  // Features to enable
  features: {
    // Enable TypeScript support
    typescript: true,
    // Enable Vue.js support
    vue: true,
    // Enable styling rules
    stylistic: true,
  },
}).append(
  // Custom rules for better code quality
  {
    rules: {
      // Allow console.log in development for debugging
      "no-console": "warn",
      // Prevent debugger statements
      "no-debugger": "error",
      // Allow alert() usage for quick debugging
      "no-alert": "warn",
      // Check for unused variables but allow underscore prefix
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Vue specific rules
      "vue/html-self-closing": "error",
      "vue/require-default-prop": "error",
      // Allow single word component names for pages
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
          ],
        },
      ],
    },
  },
);
