<template>
  <div>
    <!-- Hero section with club presentation -->
    <HomeHeroSection />

    <!-- Activities section -->
    <HomeActivitiesSection :activities="activities" />

    <!-- News section -->
    <LazyHomeNewsSection />

    <!-- Upcoming events section -->
    <LazyHomeEventsSection :events="upcomingEvents" />

    <!-- Sponsors Banner -->
    <LazySponsorsBanner :sponsors="sponsors" />

    <!-- Call-to-action section -->
    <LazyHomeCtaSection />
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
