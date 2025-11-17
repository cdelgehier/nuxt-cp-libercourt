<template>
  <div>
    <!-- Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-4xl lg:text-5xl font-bold text-white mb-4">
            Actualités
          </h1>
          <p class="text-xl text-gray-200 mb-4 max-w-2xl mx-auto">
            Suivez toutes les actualités du tennis de table : le Comité, la
            Ligue et notre club
          </p>

          <!-- Source links -->
          <div class="flex flex-wrap gap-3 justify-center">
            <a
              href="https://cd62tt.blog/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 backdrop-blur-sm bg-opacity-90 hover:bg-blue-200 transition-colors"
            >
              <UIcon name="i-heroicons-newspaper" class="w-4 h-4 mr-1.5" />
              Comité CD62TT
            </a>
            <a
              href="https://liguehdftt.fr/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 backdrop-blur-sm bg-opacity-90 hover:bg-purple-200 transition-colors"
            >
              <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 mr-1.5" />
              Ligue HDF
            </a>
            <a
              :href="clubConfig?.social?.facebook?.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 backdrop-blur-sm bg-opacity-90 hover:bg-green-200 transition-colors"
            >
              <UIcon
                name="i-heroicons-chat-bubble-left-right"
                class="w-4 h-4 mr-1.5"
              />
              Facebook
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- News List Section -->
    <section class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NewsList :limit="20" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ClubConfig } from "~/types";

// SEO metadata
useHead({
  title: "Actualités - Club Pongiste Libercourtois",
  meta: [
    {
      name: "description",
      content:
        "Suivez toutes les actualités du tennis de table : Comité CD62TT, Ligue HDF et Club Pongiste Libercourtois",
    },
    {
      name: "keywords",
      content:
        "actualités tennis de table, cd62tt, ligue hdf, club libercourtois, news ping pong",
    },
  ],
});

// Fetch club config for Facebook URL
const { data: clubConfig } = await useFetch<ClubConfig>("/api/club/config");
</script>
