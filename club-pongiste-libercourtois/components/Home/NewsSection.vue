<template>
  <!-- News section displaying latest news from Facebook, Comité and Ligue -->
  <section class="py-16 bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl font-bold adaptive-title mb-2">Actualités</h2>
          <p class="text-lg adaptive-text">
            Les dernières nouvelles du Comité, de la Ligue et du club
          </p>
        </div>
        <UButton to="/actualites" variant="outline" color="primary">
          Toutes les actualités
        </UButton>
      </div>

      <NewsList :limit="3" />
    </div>
  </section>
</template>

<script setup lang="ts">
// News section component - uses NewsList component to display articles
</script>
