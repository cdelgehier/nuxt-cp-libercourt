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
  link: [
    // Preload critical images
    { rel: "preload", href: "/images/logo-club.png", as: "image" },
    // Preload key pages for faster navigation
    { rel: "prefetch", href: "/club" },
    { rel: "prefetch", href: "/contact" },
    { rel: "prefetch", href: "/calendrier" },
  ],
  style: [
    // Inline critical CSS for faster FCP
    {
      innerHTML: `
        /* Critical above-the-fold styles */
        .hero-section{background:linear-gradient(to right,#1e3a8a,#059669);padding:3rem 1rem;color:white;text-align:center}
        @media(min-width:1024px){.hero-section{padding:4rem 1rem}}
        .hero-container{max-width:80rem;margin:0 auto;padding:0 1rem}
        @media(min-width:640px){.hero-container{padding:0 1.5rem}}
        @media(min-width:1024px){.hero-container{padding:0 2rem}}
        .hero-title{font-size:2.25rem;font-weight:700;color:white;margin-bottom:1rem;line-height:1.2}
        @media(min-width:1024px){.hero-title{font-size:3rem}}
        .hero-title-accent{color:#fbbf24}
        .hero-subtitle{font-size:1.25rem;color:#e5e7eb;margin-bottom:2rem;max-width:42rem;margin-left:auto;margin-right:auto}
        .hero-buttons{display:flex;flex-direction:column;gap:1rem;justify-content:center;align-items:center}
        @media(min-width:640px){.hero-buttons{flex-direction:row}}
        .btn-primary{display:inline-flex;align-items:center;padding:0.75rem 1.5rem;font-size:1.125rem;font-weight:600;text-decoration:none;border-radius:0.5rem;background-color:#fbbf24;color:#1e3a8a;border:2px solid transparent;transition:all 0.2s ease}
        .btn-secondary{display:inline-flex;align-items:center;padding:0.75rem 1.5rem;font-size:1.125rem;font-weight:600;text-decoration:none;border-radius:0.5rem;background-color:transparent;color:white;border:2px solid white;transition:all 0.2s ease}
        body{font-family:"Inter Fallback",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
      `,
    },
  ],
});

// SEO Configuration
useSeoMeta({
  titleTemplate: "%s | Club Pongiste Libercourtois",
  ogImage: "/images/logo-club.png",
  twitterCard: "summary_large_image",
});

// Force light mode on mount
onMounted(() => {
  if (import.meta.client) {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.setAttribute("data-theme", "light");
  }
});
</script>

<style>
/* Global styles are imported from assets/css/main.css */
</style>
