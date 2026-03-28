<script setup lang="ts">
import type { SeriesType } from "~~/server/domains/tournament/types";

const props = defineProps<{
  type: SeriesType;
  pointsLimitMin?: number | null;
  pointsLimitMax?: number | null;
}>();

const config: Record<
  SeriesType,
  {
    label: string;
    color: "neutral" | "info" | "warning" | "success" | "error" | "primary";
  }
> = {
  standard: { label: "Standard", color: "neutral" },
  speedy: { label: "Speedy ⚡", color: "warning" },
  handicap: { label: "Handicap", color: "info" },
  points_limit: { label: "", color: "neutral" },
  mixed_doubles: { label: "Double mixte", color: "info" },
  coupe_davis: { label: "Coupe Davis", color: "error" },
};

const label = computed(() => {
  if (props.type === "points_limit") {
    if (props.pointsLimitMin && props.pointsLimitMax)
      return `${props.pointsLimitMin}–${props.pointsLimitMax} pts`;
    if (props.pointsLimitMax) return `–${props.pointsLimitMax} pts`;
    if (props.pointsLimitMin) return `+${props.pointsLimitMin} pts`;
    return "Pts limités";
  }
  return config[props.type].label;
});
</script>

<template>
  <UBadge :color="config[props.type].color" variant="soft" size="sm">
    {{ label }}
  </UBadge>
</template>
