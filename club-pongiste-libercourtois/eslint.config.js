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
      // Prevent console.log in production
      "no-console": "error",
      // Prevent debugger statements
      "no-debugger": "error",
      // Prevent alert() usage
      "no-alert": "error",
      // Check for unused variables
      "no-unused-vars": "error",
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      // Vue specific rules
      "vue/html-self-closing": "error",
      "vue/require-default-prop": "error",
      "vue/multi-word-component-names": "error",
    },
  },
);
