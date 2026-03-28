<script setup lang="ts">
import type { SeriesRegistration } from "~~/server/domains/tournament/types";

const props = defineProps<{ registrations: SeriesRegistration[] }>();
const model = defineModel<string | null>({ default: null });

const clubs = computed(() => {
  const set = new Set<string>();
  for (const r of props.registrations) {
    if (r.club) set.add(r.club);
    if (r.partnerClub) set.add(r.partnerClub);
  }
  return [...set].sort();
});

const options = computed(() => [
  { label: "Tous les clubs", value: null },
  ...clubs.value.map((c) => ({ label: c, value: c })),
]);
</script>

<template>
  <USelect
    v-model="model"
    :items="options"
    size="sm"
    placeholder="Filtrer par club"
    class="w-48"
  />
</template>
