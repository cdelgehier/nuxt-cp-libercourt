// Nuxt UI v2 theme overrides
// Primary color is yellow (#FFD700) — white text fails WCAG contrast.
// Use club-navy text on yellow for all primary solid buttons.
export default defineAppConfig({
  ui: {
    button: {
      color: {
        primary: {
          solid:
            "shadow-sm text-club-navy dark:text-club-navy bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500 aria-disabled:bg-primary-500 dark:bg-primary-400 dark:hover:bg-primary-500 dark:disabled:bg-primary-400 dark:aria-disabled:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400",
          outline:
            "ring-1 ring-inset ring-current text-club-navy dark:text-club-navy hover:bg-primary-50 dark:hover:bg-primary-950 focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400",
          soft: "text-club-navy dark:text-club-navy bg-primary-50 dark:bg-primary-950 hover:bg-primary-100 dark:hover:bg-primary-900 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400",
        },
      },
    },
  },
});
