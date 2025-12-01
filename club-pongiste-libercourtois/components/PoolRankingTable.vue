<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h4 class="font-medium text-gray-900 dark:text-white">
        Classement de la poule
      </h4>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-6">
      <UIcon
        name="i-heroicons-arrow-path"
        class="mx-auto h-6 w-6 text-club-green animate-spin"
      />
      <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
        Chargement du classement...
      </p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="text-center py-6 bg-red-50 dark:bg-red-900/20 rounded-lg"
    >
      <p class="text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>
    </div>

    <!-- Ranking table -->
    <div
      v-else-if="rankings && rankings.length > 0"
      class="overflow-x-auto -mx-4 sm:mx-0"
    >
      <div class="inline-block min-w-full align-middle">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Pos
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Équipe
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Pts
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell"
              >
                V-D
              </th>
              <th
                scope="col"
                class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"
              ></th>
            </tr>
          </thead>
          <tbody
            class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
          >
            <tr
              v-for="entry in rankings"
              :key="entry.teamId || entry.clubNumber"
              :class="[
                entry.isClubTeam ? 'bg-club-green/5 dark:bg-club-green/10' : '',
              ]"
            >
              <!-- Position -->
              <td
                class="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ entry.position }}
              </td>

              <!-- Team name -->
              <td class="px-3 py-3 text-sm text-gray-900 dark:text-white">
                <span :class="entry.isClubTeam ? 'font-semibold' : ''">
                  {{ entry.teamName }}
                </span>
              </td>

              <!-- Points -->
              <td
                class="px-3 py-3 whitespace-nowrap text-sm text-center font-semibold text-gray-900 dark:text-white"
              >
                {{ entry.points }}
              </td>

              <!-- Victories - Defeats -->
              <td
                class="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell"
              >
                <span class="text-green-600 dark:text-green-400">{{
                  entry.victories
                }}</span>
                -
                <span class="text-red-600 dark:text-red-400">{{
                  entry.defeats
                }}</span>
              </td>

              <!-- Zone icon -->
              <td class="px-3 py-3 whitespace-nowrap text-center">
                <UIcon
                  v-if="getZoneIcon(entry.zone)"
                  :name="getZoneIcon(entry.zone)"
                  :class="['w-5 h-5', getZoneColor(entry.zone)]"
                  :title="getZoneLabel(entry.zone)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Aucun classement disponible
      </p>
    </div>

    <!-- Legend -->
    <div
      v-if="rankings && rankings.length > 0"
      class="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center gap-1">
        <UIcon
          name="i-heroicons-arrow-up-circle"
          class="w-4 h-4 text-green-500"
        />
        <span>Montée</span>
      </div>
      <div class="flex items-center gap-1">
        <UIcon
          name="i-heroicons-arrow-down-circle"
          class="w-4 h-4 text-red-500"
        />
        <span>Relégation</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PoolRankingEntry } from "~/composables/usePoolRanking";

interface Props {
  rankings: PoolRankingEntry[];
  loading?: boolean;
  error?: string | null;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
});

const { getZoneIcon, getZoneColor, getZoneLabel } = usePoolRanking();
</script>
