<template>
  <UApp>
    <!-- Skip to content link for accessibility -->
    <a href="#main-content" class="skip-to-content">
      Aller au contenu principal
    </a>

    <!-- Main application -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
// Meta configuration globale
useHead({
  htmlAttrs: {
    lang: "fr",
    "data-theme": "light",
  },
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "format-detection", content: "telephone=no" },
  ],
  bodyAttrs: {
    class: "light",
  },
});

// SEO Configuration
useSeoMeta({
  titleTemplate: "%s | Club Pongiste Libercourtois",
  ogImage: "/images/logo-club.webp",
  twitterCard: "summary_large_image",
});
</script>

<style>
/* Global styles are imported from assets/css/main.css */
</style>
