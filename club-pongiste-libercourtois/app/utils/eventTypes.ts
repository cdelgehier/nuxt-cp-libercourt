export const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; class: string }
> = {
  tournament: {
    label: "Tournoi",
    class: "bg-accent-50 text-accent-600",
  },
  competition: {
    label: "Compétition",
    class:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
  },
  stage: {
    label: "Stage",
    class:
      "bg-secondary-50 text-secondary-800 dark:bg-secondary-900/20 dark:text-secondary-200",
  },
  meeting: {
    label: "Réunion",
    class:
      "bg-club-navy/10 text-club-navy dark:bg-club-navy/20 dark:text-club-yellow",
  },
  training: {
    label: "Entraînement",
    class:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300",
  },
  social: {
    label: "Social",
    class: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
  },
  other: {
    label: "Autre",
    class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
};

export function getEventTypeConfig(type: string) {
  return EVENT_TYPE_CONFIG[type] ?? EVENT_TYPE_CONFIG.other!;
}
