export const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; class: string }
> = {
  tournament: {
    label: "Tournoi",
    class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  competition: {
    label: "Compétition",
    class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  stage: {
    label: "Stage",
    class: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  },
  meeting: {
    label: "Réunion",
    class:
      "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
  },
  training: {
    label: "Entraînement",
    class:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  social: {
    label: "Social",
    class: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  other: {
    label: "Autre",
    class: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300",
  },
};

export function getEventTypeConfig(type: string) {
  return EVENT_TYPE_CONFIG[type] ?? EVENT_TYPE_CONFIG.other!;
}
