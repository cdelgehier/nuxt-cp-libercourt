<template>
  <div>
    <!-- Hero section with club presentation -->
    <HomeHeroSection />

    <!-- Activities section -->
    <HomeActivitiesSection :activities="activities" />

    <!-- News section -->
    <HomeNewsSection />

    <!-- Upcoming events section -->
    <HomeEventsSection :events="upcomingEvents" />

    <!-- Sponsors Banner -->
    <SponsorsBanner :sponsors="sponsors" />

    <!-- Call-to-action section -->
    <HomeCtaSection />
  </div>
</template>

<script setup lang="ts">
// Home page - displays hero, activities, news, events, sponsors, and CTA sections
// Uses composables to fetch data with Zod validation

// SEO configuration for home page
useSeoMeta({
  title: "Accueil",
  description:
    "Club Pongiste Libercourtois - Club de tennis de table convivial à Libercourt depuis 1970. Activités pour tous âges et niveaux.",
  keywords:
    "tennis de table, ping-pong, club sportif, Libercourt, activités jeunes adultes",
});

// Load sponsors data using composable with Zod validation
const { sponsors } = await useSponsors();

// Load activities data using composable with Zod validation
const { activities } = await useActivities();

// Load upcoming events using composable with Zod validation
const { events: upcomingEvents } = await useUpcomingEvents(3);
</script>
