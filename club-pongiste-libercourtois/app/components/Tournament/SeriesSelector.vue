<script setup lang="ts">
import type { TournamentSeries } from "~~/server/domains/tournament/types";

defineProps<{
  series: Array<TournamentSeries & { registrationCount: number }>;
  modelValue: number | null;
}>();

defineEmits<{ "update:modelValue": [id: number] }>();
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    <button
      v-for="s in series"
      :key="s.id"
      class="text-left rounded-lg border-2 px-4 py-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      :class="
        modelValue === s.id
          ? 'border-primary-500 bg-primary-50 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      "
      @click="$emit('update:modelValue', s.id)"
    >
      <div class="font-semibold text-base leading-tight mb-2">
        {{ s.name }}
      </div>
      <div class="flex items-center gap-1 flex-wrap mb-1.5">
        <TournamentSeriesStatusBadge :status="s.status" />
        <TournamentSeriesTypeBadge
          :type="s.seriesType"
          :points-limit-min="s.pointsLimitMin"
          :points-limit-max="s.pointsLimitMax"
        />
      </div>
      <div class="text-sm text-gray-400">
        {{ s.registrationCount }}
        {{ s.seriesFormat === "doubles" ? "paires" : "joueurs" }}
        <span v-if="s.femalesOnly"> · ♀</span>
      </div>
    </button>
  </div>
</template>
