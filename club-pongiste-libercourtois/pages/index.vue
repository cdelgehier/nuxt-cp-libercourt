<template>
  <div>
    <!-- Hero section with club presentation -->
    <HomeHeroSection />

    <!-- Activities section -->
    <HomeActivitiesSection :activities="activities" />

    <!-- News section - wrapped in ClientOnly to prevent hydration mismatch from dynamic fetches -->
    <ClientOnly>
      <HomeNewsSection />
    </ClientOnly>

    <!-- Upcoming events section - wrapped in ClientOnly to prevent hydration mismatch from date formatting -->
    <ClientOnly>
      <HomeEventsSection :events="upcomingEvents" />
    </ClientOnly>

    <!-- Sponsors Banner - wrapped in ClientOnly to prevent hydration mismatch from CSS animations -->
    <ClientOnly>
      <SponsorsBanner
        v-show="sponsors && sponsors.length > 0"
        :sponsors="sponsors"
      />
    </ClientOnly>

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
const { sponsors: sponsorsData } = useSponsors();

// Load activities data using composable with Zod validation
const { activities: activitiesData } = useActivities();

// Load upcoming events using composable with Zod validation
const { events: eventsData } = useUpcomingEvents(3);

// Create computed properties for safer access
const sponsors = computed(() => sponsorsData.value || []);
const activities = computed(() => activitiesData.value || []);
const upcomingEvents = computed(() => eventsData.value || []);

// Debug: log sponsors data
if (process.client) {
  watch(
    sponsors,
    (newVal) => {
      console.log("Sponsors data updated:", newVal?.length);
    },
    { immediate: true },
  );
}
</script>
