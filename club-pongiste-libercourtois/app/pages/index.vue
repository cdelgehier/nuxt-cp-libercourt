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
import type { Activity, CalendarEvent, Partner } from "~~/schemas";

// SEO configuration for home page
useSeoMeta({
  title: "Accueil",
  description:
    "Club Pongiste Libercourtois - Club de tennis de table convivial à Libercourt depuis 1970. Activités pour tous âges et niveaux.",
  keywords:
    "tennis de table, ping-pong, club sportif, Libercourt, activités jeunes adultes",
});

// Lazy fetching: hero renders immediately without blocking SSR on DB calls
const { data: activitiesData } = useLazyFetch<{ activities: Activity[] }>(
  "/api/activities",
);
const { data: eventsData } = useLazyFetch<{ events: CalendarEvent[] }>(
  "/api/events/upcoming?limit=3",
);
const { data: sponsorsData } = useLazyFetch<{ sponsors: Partner[] }>(
  "/api/sponsors",
);

const activities = computed(() => activitiesData.value?.activities ?? []);
const upcomingEvents = computed(() => eventsData.value?.events ?? []);
const sponsors = computed(() => sponsorsData.value?.sponsors ?? []);
</script>
