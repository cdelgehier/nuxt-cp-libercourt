<script setup lang="ts">
import type { TournamentWithSeries } from "~~/server/domains/tournament/types";

const route = useRoute();
const slug = route.params.slug as string;

const { data: tournament, pending } = await useFetch<TournamentWithSeries>(
  `/api/tournois/${slug}`,
);

useSeoMeta({
  title: computed(() =>
    tournament.value ? `${tournament.value.name} — Tournois` : "Tournoi",
  ),
});

function formatDate(d: string, end?: string | null): string {
  return formatDateRange(d, end);
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div v-if="pending">
      <USkeleton class="h-8 w-64 mb-4" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 4" :key="i" class="h-36 rounded-xl" />
      </div>
    </div>

    <template v-else-if="tournament">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink
          to="/tournois"
          class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Tous les tournois
        </NuxtLink>
        <h1 class="text-3xl font-bold text-club-navy dark:text-gray-100">
          {{ tournament.name }}
        </h1>
        <div
          class="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
            {{ formatDate(tournament.date, tournament.dateEnd) }}
          </span>
          <span v-if="tournament.location" class="flex items-center gap-1">
            <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
            {{ tournament.location }}
          </span>
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-table-cells" class="w-4 h-4" />
            {{ tournament.tableCount }} table{{
              tournament.tableCount > 1 ? "s" : ""
            }}
          </span>
        </div>
        <p v-if="tournament.description" class="mt-3 text-gray-600">
          {{ tournament.description }}
        </p>
      </div>

      <!-- JA link -->
      <div class="mb-6">
        <NuxtLink :to="`/tournois/${slug}/ja`">
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            icon="i-heroicons-clipboard-document-check"
          >
            Interface Juge Arbitre
          </UButton>
        </NuxtLink>
      </div>

      <!-- Series grid -->
      <div
        v-if="tournament.series.length === 0"
        class="text-center text-gray-500 py-12"
      >
        Aucune série disponible pour ce tournoi.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <TournamentSeriesCard
          v-for="series in tournament.series"
          :key="series.id"
          :series="series"
          :slug="slug"
        />
      </div>
    </template>
  </div>
</template>
