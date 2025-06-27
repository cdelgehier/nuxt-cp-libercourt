<template>
  <div>
    <!-- Skip to content link for accessibility -->
    <a href="#main-content" class="skip-to-content">
      Aller au contenu principal
    </a>

    <!-- Main application -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global modals and overlays -->
    <UNotifications />
  </div>
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
  ogImage: "/images/logo-club.png",
  twitterCard: "summary_large_image",
});

// Force light mode on mount
onMounted(() => {
  if (process.client) {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.setAttribute("data-theme", "light");
  }
});
</script>

<style>
/* Global styles are imported from assets/css/main.css */
</style>
