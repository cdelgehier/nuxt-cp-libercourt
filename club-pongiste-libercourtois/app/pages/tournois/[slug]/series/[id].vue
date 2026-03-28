<script setup lang="ts">
import type {
  SeriesWithBracket,
  SeriesRegistration,
} from "~~/server/domains/tournament/types";

const route = useRoute();
const slug = route.params.slug as string;
const id = Number(route.params.id);

const {
  data: series,
  pending,
  refresh,
} = await useFetch<SeriesWithBracket>(`/api/tournois/${slug}/series/${id}`);

useSeoMeta({
  title: computed(() =>
    series.value ? `${series.value.name} — Tableau` : "Tableau",
  ),
});

// Club filter
const selectedClub = ref<string | null>(null);

// Flatten all registrations from the series
const allRegistrations = computed<SeriesRegistration[]>(
  () => series.value?.registrations ?? [],
);

// ID of registrations matching selected club
const highlightIds = computed<Set<number>>(() => {
  if (!selectedClub.value) return new Set();
  return new Set(
    allRegistrations.value
      .filter(
        (r) =>
          r.club === selectedClub.value || r.partnerClub === selectedClub.value,
      )
      .map((r) => r.id),
  );
});

// Polling every 30s while series is in progress
const { pause, resume } = useIntervalFn(() => {
  if (series.value?.status === "in_progress") refresh();
}, 30000);

watch(
  () => series.value?.status,
  (s) => (s === "in_progress" ? resume() : pause()),
  { immediate: true },
);

onUnmounted(() => pause());
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 py-8">
    <div v-if="pending">
      <USkeleton class="h-8 w-64 mb-4" />
      <USkeleton class="h-64 rounded-xl" />
    </div>

    <template v-else-if="series">
      <!-- Header -->
      <div class="mb-6">
        <NuxtLink
          :to="`/tournois/${slug}`"
          class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Retour au tournoi
        </NuxtLink>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-bold text-club-navy dark:text-gray-100">
            {{ series.name }}
          </h1>
          <TournamentSeriesStatusBadge :status="series.status" />
          <TournamentSeriesTypeBadge
            :type="series.seriesType"
            :points-limit-min="series.pointsLimitMin"
            :points-limit-max="series.pointsLimitMax"
          />
        </div>
        <p class="mt-1 text-sm text-gray-500">
          {{ series.seriesFormat === "doubles" ? "Double" : "Simple" }} · Best
          of {{ series.setsToWin * 2 - 1 }} ({{ series.pointsPerSet }} pts/set)
        </p>
      </div>

      <!-- Club filter -->
      <div
        v-if="allRegistrations.length > 0"
        class="mb-4 flex items-center gap-2"
      >
        <span class="text-sm text-gray-500">Filtrer :</span>
        <TournamentClubFilter
          v-model="selectedClub"
          :registrations="allRegistrations"
        />
      </div>

      <!-- Bracket -->
      <TournamentBracketView
        :rounds="series.rounds"
        :highlight="highlightIds.size > 0 ? highlightIds : null"
      />
    </template>
  </div>
</template>
