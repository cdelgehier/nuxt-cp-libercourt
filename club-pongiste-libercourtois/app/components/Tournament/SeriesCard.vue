<script setup lang="ts">
import type { TournamentSeries } from "~~/server/domains/tournament/types";

defineProps<{
  series: TournamentSeries & { registrationCount: number };
  slug: string;
}>();
</script>

<template>
  <UCard class="hover:shadow-md transition-shadow">
    <template #header>
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold text-base leading-tight">{{ series.name }}</h3>
        <TournamentSeriesStatusBadge :status="series.status" />
      </div>
    </template>

    <div class="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
      <TournamentSeriesTypeBadge
        :type="series.seriesType"
        :points-limit-min="series.pointsLimitMin"
        :points-limit-max="series.pointsLimitMax"
      />
      <span class="text-gray-400">•</span>
      <span>{{ series.seriesFormat === "doubles" ? "Double" : "Simple" }}</span>
      <span class="text-gray-400">•</span>
      <span
        >{{ series.registrationCount }} joueur{{
          series.registrationCount > 1 ? "s" : ""
        }}</span
      >
    </div>

    <template #footer>
      <NuxtLink :to="`/tournois/${slug}/series/${series.id}`">
        <UButton size="sm" variant="outline" color="neutral" block>
          Voir le tableau
        </UButton>
      </NuxtLink>
    </template>
  </UCard>
</template>
