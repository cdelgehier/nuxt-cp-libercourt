<script setup lang="ts">
import type { SeriesStatus } from "~~/server/domains/tournament/types";

const props = defineProps<{ status: SeriesStatus }>();

const config: Record<
  SeriesStatus,
  {
    label: string;
    color: "neutral" | "info" | "warning" | "success" | "primary" | "error";
  }
> = {
  draft: { label: "Brouillon", color: "neutral" },
  registration: { label: "Inscriptions", color: "info" },
  bracket_generated: { label: "Tableau prêt", color: "warning" },
  in_progress: { label: "En cours", color: "success" },
  finished: { label: "Terminée", color: "neutral" },
};
</script>

<template>
  <UBadge :color="config[props.status].color" variant="soft" size="sm">
    {{ config[props.status].label }}
  </UBadge>
</template>
