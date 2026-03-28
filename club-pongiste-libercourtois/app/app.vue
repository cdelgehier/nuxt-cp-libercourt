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
const colorMode = useColorMode();

// Meta configuration globale
useHead(() => ({
  htmlAttrs: {
    lang: "fr",
    "data-theme": colorMode.value,
  },
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "format-detection", content: "telephone=no" },
  ],
}));

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
