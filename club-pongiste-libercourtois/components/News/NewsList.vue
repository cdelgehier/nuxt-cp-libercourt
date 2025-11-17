<template>
  <div class="news-list">
    <!-- Loading state -->
    <div
      v-if="pending"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div v-for="i in limit" :key="i" class="animate-pulse">
        <div class="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <UIcon
        name="i-heroicons-exclamation-triangle"
        class="w-12 h-12 mx-auto mb-4 text-red-500"
      />
      <p class="text-lg font-semibold mb-2">Erreur de chargement</p>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Impossible de charger les actualités pour le moment.
      </p>
      <UButton @click="refresh">Réessayer</UButton>
    </div>

    <!-- No articles state -->
    <div
      v-else-if="!data || data.articles.length === 0"
      class="text-center py-12"
    >
      <UIcon
        name="i-heroicons-newspaper"
        class="w-12 h-12 mx-auto mb-4 text-gray-400"
      />
      <p class="text-lg font-semibold mb-2">Aucune actualité</p>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Aucune actualité disponible pour le moment.
      </p>
    </div>

    <!-- Articles list - compact feed -->
    <div v-else class="max-w-4xl mx-auto space-y-4">
      <article
        v-for="article in data.articles"
        :key="article.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="p-4">
          <!-- Header -->
          <div class="flex items-center justify-between mb-3">
            <span
              :class="getSourceBadgeClass(article.source)"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            >
              <UIcon
                :name="getSourceIcon(article.source)"
                class="w-3 h-3 mr-1"
              />
              {{ getSourceLabel(article.source) }}
            </span>
            <time class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(article.publishedAt) }}
            </time>
          </div>

          <!-- Content layout differs for Facebook posts -->
          <div v-if="article.source === 'facebook'" class="space-y-3">
            <!-- Image full width for Facebook -->
            <div v-if="article.image">
              <img
                :src="article.image"
                :alt="article.title"
                class="w-full max-h-96 object-cover rounded"
              />
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ article.title }}
            </h3>

            <!-- Full description for Facebook -->
            <p
              class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap"
            >
              {{ article.description }}
            </p>

            <!-- Categories -->
            <div
              v-if="article.categories.length > 0"
              class="flex flex-wrap gap-1"
            >
              <span
                v-for="category in article.categories"
                :key="category"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {{ category }}
              </span>
            </div>

            <!-- Link -->
            <a
              :href="article.link"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
            >
              Voir sur Facebook
              <UIcon
                name="i-heroicons-arrow-top-right-on-square"
                class="w-3 h-3"
              />
            </a>
          </div>

          <!-- Compact layout for other sources -->
          <div v-else class="flex gap-4">
            <!-- Image (if available) - smaller, on the side -->
            <div v-if="article.image" class="flex-shrink-0">
              <img
                :src="article.image"
                :alt="article.title"
                class="w-32 h-32 object-cover rounded"
              />
            </div>

            <!-- Text content -->
            <div class="flex-1 min-w-0">
              <!-- Title -->
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                {{ article.title }}
              </h3>

              <!-- Categories -->
              <div
                v-if="article.categories.length > 0"
                class="flex flex-wrap gap-1 mb-2"
              >
                <span
                  v-for="category in article.categories"
                  :key="category"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {{ category }}
                </span>
              </div>

              <!-- Link -->
              <a
                :href="article.link"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Lire la suite
                <UIcon
                  name="i-heroicons-arrow-top-right-on-square"
                  class="w-3 h-3"
                />
              </a>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Last updated info -->
    <div
      v-if="data && data.articles.length > 0"
      class="mt-8 text-center text-xs text-gray-500 dark:text-gray-400"
    >
      Dernière mise à jour : {{ formattedLastUpdate }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NewsResponse } from "~/types";

// Props
const props = withDefaults(
  defineProps<{
    limit?: number;
  }>(),
  {
    limit: 10,
  },
);

// Fetch news from API
const { data, pending, error, refresh } = await useFetch<NewsResponse>(
  "/api/news",
  {
    query: {
      limit: props.limit,
    },
  },
);

// Use news composable for helper functions
const { getSourceBadgeClass, getSourceIcon, getSourceLabel, formatDate } =
  useNews();

// Format last update time
const formattedLastUpdate = computed(() => {
  if (!data.value?.lastUpdated) return "";
  return formatDate(data.value.lastUpdated);
});
</script>

<style scoped>
.news-list {
  width: 100%;
}
</style>
