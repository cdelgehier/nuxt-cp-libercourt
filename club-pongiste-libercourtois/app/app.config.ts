// Nuxt UI v4 theme overrides (Tailwind Variants)
// Primary color is yellow (#FFD700) — white text fails WCAG contrast.
// Use club-navy text on yellow for all primary buttons.
export default defineAppConfig({
  ui: {
    colors: {
      primary: "primary",
      neutral: "neutral",
    },
    button: {
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class: "text-club-navy dark:text-club-navy",
        },
        {
          color: "primary",
          variant: "outline",
          class: "text-club-navy dark:text-club-navy",
        },
        {
          color: "primary",
          variant: "soft",
          class: "text-club-navy dark:text-club-navy",
        },
      ],
    },
  },
});
