<script setup lang="ts">
import type { EnrichedTournament } from "~~/server/domains/tournament/types";

useSeoMeta({ title: "Tournois — Club Pongiste Libercourtois" });

const { data: tournaments, pending } =
  await useFetch<EnrichedTournament[]>("/api/tournois");

function formatDate(t: EnrichedTournament): string {
  return formatDateRange(t.date, t.dateEnd);
}

function mapsUrl(t: EnrichedTournament): string {
  if (t.locationLat && t.locationLng) {
    return `https://www.google.com/maps?q=${t.locationLat},${t.locationLng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.location ?? "")}`;
}

// Share modal
const shareModalOpen = ref(false);
const shareTournament = ref<EnrichedTournament | null>(null);

function openShare(t: EnrichedTournament, e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  shareTournament.value = t;
  shareModalOpen.value = true;
}

const shareUrl = computed(() => {
  if (!shareTournament.value) return "";
  return `${useRequestURL().origin}/tournois/${shareTournament.value.slug}`;
});

const qrUrl = computed(() =>
  shareUrl.value
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl.value)}`
    : "",
);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-club-navy dark:text-gray-100 mb-8">
      Tournois
    </h1>

    <div
      v-if="pending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <USkeleton v-for="i in 3" :key="i" class="h-40 rounded-xl" />
    </div>

    <div
      v-else-if="!tournaments || tournaments.length === 0"
      class="text-center text-gray-500 py-16"
    >
      Aucun tournoi à venir pour le moment.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="t in tournaments"
        :key="t.id"
        :to="`/tournois/${t.slug}`"
        class="group"
      >
        <UCard
          class="h-full hover:shadow-md transition-shadow group-hover:border-primary-300"
        >
          <template #header>
            <div class="flex items-start justify-between gap-2">
              <h2
                class="font-semibold text-base leading-tight text-club-navy dark:text-gray-100 group-hover:text-primary-600 transition-colors"
              >
                {{ t.name }}
              </h2>
              <button
                class="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Partager"
                @click="openShare(t, $event)"
              >
                <UIcon name="i-heroicons-share" class="w-4 h-4" />
              </button>
            </div>
          </template>

          <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-calendar"
                class="w-4 h-4 text-gray-400 shrink-0"
              />
              {{ formatDate(t) }}
            </div>
            <a
              v-if="t.location"
              :href="mapsUrl(t)"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 hover:text-primary-600 transition-colors"
              @click.stop
            >
              <UIcon
                name="i-heroicons-map-pin"
                class="w-4 h-4 text-gray-400 shrink-0"
              />
              {{ t.location }}
            </a>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-rectangle-stack"
                class="w-4 h-4 text-gray-400 shrink-0"
              />
              {{ t.seriesCount }} série{{ t.seriesCount > 1 ? "s" : "" }}
            </div>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-table-cells"
                class="w-4 h-4 text-gray-400 shrink-0"
              />
              {{ t.tableCount }} table{{ t.tableCount > 1 ? "s" : "" }}
            </div>
            <div v-if="t.totalRegistrants > 0" class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-users"
                class="w-4 h-4 text-gray-400 shrink-0"
              />
              {{ t.totalRegistrants }} inscrit{{
                t.totalRegistrants > 1 ? "s" : ""
              }}
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Share modal -->
    <UModal v-model:open="shareModalOpen">
      <template #content>
        <div class="p-6 flex flex-col items-center gap-4 text-center">
          <h3 class="font-semibold text-lg">{{ shareTournament?.name }}</h3>
          <img
            v-if="qrUrl"
            :src="qrUrl"
            alt="QR Code"
            class="w-[220px] h-[220px] rounded"
          />
          <p class="text-sm text-gray-500 break-all max-w-xs">{{ shareUrl }}</p>
          <UButton
            variant="outline"
            icon="i-heroicons-clipboard-document"
            @click="navigator.clipboard.writeText(shareUrl)"
          >
            Copier le lien
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
