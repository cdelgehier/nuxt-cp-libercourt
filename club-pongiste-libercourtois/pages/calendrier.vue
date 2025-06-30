<template>
  <div class="min-h-screen page-section">
    <!-- Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-4xl lg:text-5xl font-bold mb-4">
            Calendrier des
            <span class="text-club-yellow">Événements</span>
          </h1>
          <p class="text-xl text-gray-200 max-w-3xl mx-auto">
            Découvrez tous nos événements, tournois et compétitions à venir
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Loading State -->
      <div v-if="pending" class="text-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="mx-auto h-12 w-12 text-club-green animate-spin"
        />
        <p class="mt-2 adaptive-text">Chargement du calendrier...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="rounded-md bg-red-50 p-4 max-w-md mx-auto">
          <svg
            class="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 class="mt-2 text-lg font-medium text-red-800">
          Erreur de chargement
        </h3>
        <p class="mt-1 text-red-600">
          {{ error }}
        </p>
        <button
          class="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          @click="refresh()"
        >
          Réessayer
        </button>
      </div>

      <div v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="adaptive-card overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg
                    class="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium adaptive-text truncate">
                      Total événements
                    </dt>
                    <dd class="text-lg font-medium adaptive-title">
                      {{ data?.totalEvents || 0 }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="adaptive-card overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg
                    class="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium adaptive-text truncate">
                      Inscriptions ouvertes
                    </dt>
                    <dd class="text-lg font-medium adaptive-title">
                      {{ eventsWithOpenRegistration.length }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="adaptive-card overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg
                    class="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium adaptive-text truncate">
                      Deadlines urgentes
                    </dt>
                    <dd class="text-lg font-medium adaptive-title">
                      {{ eventsWithApproachingDeadline.length }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="adaptive-card overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg
                    class="h-6 w-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium adaptive-text truncate">
                      Événements fermés
                    </dt>
                    <dd class="text-lg font-medium adaptive-title">
                      {{ upcomingEventsClosedRegistration.length }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Event Filter Search -->
        <div class="mb-8">
          <div class="max-w-md mx-auto">
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <UIcon
                  name="i-heroicons-magnifying-glass"
                  class="h-5 w-5 text-gray-400"
                />
              </div>
              <input
                v-model="searchQuery"
                type="text"
                class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-club-green focus:border-club-green adaptive-text"
                placeholder="Rechercher un événement... (ex: Adulte, Juillet, Deladerriere)"
              />
              <div
                v-if="searchQuery"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <button
                  class="text-gray-400 hover:text-gray-600 focus:outline-none"
                  @click="searchQuery = ''"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
                </button>
              </div>
            </div>
            <!-- Search results summary -->
            <div
              v-if="searchQuery && filteredEventsCount !== null"
              class="mt-2 text-sm text-gray-600 text-center"
            >
              {{ filteredEventsCount }} événement{{
                filteredEventsCount > 1 ? "s" : ""
              }}
              trouvé{{ filteredEventsCount > 1 ? "s" : "" }}
            </div>
          </div>
        </div>

        <!-- Events with Open Registration -->
        <div v-if="eventsWithOpenRegistration.length > 0" class="mb-12">
          <div class="flex items-center mb-6">
            <svg
              class="h-6 w-6 text-green-600 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 class="text-2xl font-bold adaptive-title">
              Inscriptions ouvertes
            </h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EventCard
              v-for="event in eventsWithOpenRegistration"
              :key="event.id"
              :event="event"
              @register="handleRegister"
            />
          </div>
        </div>

        <!-- Upcoming Events with Closed Registration -->
        <div v-if="upcomingEventsClosedRegistration.length > 0" class="mb-12">
          <div class="flex items-center mb-6">
            <svg
              class="h-6 w-6 text-gray-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 class="text-2xl font-bold adaptive-title">
              Événements à venir (inscriptions fermées)
            </h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EventCard
              v-for="event in upcomingEventsClosedRegistration"
              :key="event.id"
              :event="event"
            />
          </div>
        </div>

        <!-- Past Events -->
        <div v-if="pastEvents.length > 0">
          <h2 class="text-2xl font-bold adaptive-title mb-4">
            Événements passés
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EventCard
              v-for="event in pastEvents"
              :key="event.id"
              :event="event"
              :past="true"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="
            !eventsWithOpenRegistration.length &&
            !upcomingEventsClosedRegistration.length &&
            !pastEvents.length
          "
          class="text-center py-12"
        >
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium adaptive-title">
            Aucun événement
          </h3>
          <p class="mt-1 text-sm adaptive-text">
            Aucun événement n'est actuellement programmé.
          </p>
        </div>
      </div>
    </div>

    <!-- Registration Modal -->
    <RegistrationModal
      v-if="selectedEvent"
      :event="selectedEvent"
      :show="showRegistrationModal"
      @close="showRegistrationModal = false"
      @success="onRegister"
    />
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from "~/types";
import EventCard from "~/components/Events/EventCard.vue";
import RegistrationModal from "~/components/Events/RegistrationModal.vue";

// Data fetching
const { data, pending, error, refresh } = useLazyFetch("/api/events/calendar");

// Search and filter functionality
const searchQuery = ref("");

// Function to check if event matches search query
const eventMatchesSearch = (event: CalendarEvent, query: string): boolean => {
  if (!query.trim()) return true;

  const searchTerms = query.toLowerCase().trim();

  // Get event date and format it for month name matching
  const eventDate = new Date(event.date);
  const monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const monthName = monthNames[eventDate.getMonth()];

  // Create searchable text from all event properties
  const searchableText = [
    event.title,
    event.description,
    event.location,
    event.type,
    monthName,
    eventDate.getFullYear().toString(),
    event.contact?.name,
    event.contact?.role,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Check if search terms match any part of the event data
  return searchableText.includes(searchTerms);
};

// Load club configuration for dynamic content
const { data: clubConfig } = await useFetch("/api/club/config");

// SEO with dynamic club name
useHead({
  title: `Calendrier des Événements - ${clubConfig.value?.club?.name || "Club Pongiste Libercourtois"}`,
  meta: [
    {
      name: "description",
      content: `Découvrez le calendrier complet des événements, tournois et compétitions du ${clubConfig.value?.club?.name || "Club Pongiste Libercourtois"}.`,
    },
  ],
});

// SEO with dynamic club name
useHead({
  title: `Calendrier des Événements - ${clubConfig.value?.club?.name || "Club Pongiste Libercourtois"}`,
  meta: [
    {
      name: "description",
      content: `Découvrez le calendrier complet des événements, tournois et compétitions du ${clubConfig.value?.club?.name || "Club Pongiste Libercourtois"}.`,
    },
  ],
});

// Registration modal state
const showRegistrationModal = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);

// Computed properties with smart event logic
const referenceDate = new Date();

// Events with open registration (future deadline and registrationOpen)
const eventsWithOpenRegistration = computed(() => {
  if (!data.value?.events) return [];
  return data.value.events
    .filter((event: CalendarEvent) => {
      const eventDate = new Date(event.date);
      // If no registration deadline, use event date as deadline
      const deadlineDate = event.registrationDeadline
        ? new Date(event.registrationDeadline)
        : eventDate;

      const meetsDateCriteria =
        eventDate >= referenceDate &&
        deadlineDate >= referenceDate &&
        event.registrationOpen;

      // Apply search filter
      return meetsDateCriteria && eventMatchesSearch(event, searchQuery.value);
    })
    .sort((a: CalendarEvent, b: CalendarEvent) => {
      // Sort by event date (earliest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
});

// Future events with closed registration (deadline passed or registrationOpen false)
const upcomingEventsClosedRegistration = computed(() => {
  if (!data.value?.events) return [];
  return data.value.events
    .filter((event: CalendarEvent) => {
      const eventDate = new Date(event.date);
      // If no registration deadline, use event date as deadline
      const deadlineDate = event.registrationDeadline
        ? new Date(event.registrationDeadline)
        : eventDate;

      const meetsDateCriteria =
        eventDate >= referenceDate &&
        (deadlineDate < referenceDate || !event.registrationOpen);

      // Apply search filter
      return meetsDateCriteria && eventMatchesSearch(event, searchQuery.value);
    })
    .sort((a: CalendarEvent, b: CalendarEvent) => {
      // Sort by event date (earliest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
});

// Past events (event date has passed)
const pastEvents = computed(() => {
  if (!data.value?.events) return [];
  return data.value.events
    .filter((event: CalendarEvent) => {
      const eventDate = new Date(event.date);
      const meetsDateCriteria = eventDate < referenceDate;

      // Apply search filter
      return meetsDateCriteria && eventMatchesSearch(event, searchQuery.value);
    })
    .sort((a: CalendarEvent, b: CalendarEvent) => {
      // Sort by event date (most recent first for past events)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
});

// Events with registration deadline approaching (within 7 days)
const eventsWithApproachingDeadline = computed(() => {
  if (!data.value?.events) return [];
  const sevenDaysFromNow = new Date(
    referenceDate.getTime() + 7 * 24 * 60 * 60 * 1000,
  );
  return eventsWithOpenRegistration.value.filter((event: CalendarEvent) => {
    if (!event.registrationDeadline) return false;
    const registrationDeadline = new Date(event.registrationDeadline);
    return registrationDeadline <= sevenDaysFromNow;
  });
});

// Total count of filtered events for search results display
const filteredEventsCount = computed(() => {
  if (!searchQuery.value.trim()) return null;

  const totalFilteredEvents =
    eventsWithOpenRegistration.value.length +
    upcomingEventsClosedRegistration.value.length +
    pastEvents.value.length;

  return totalFilteredEvents;
});

// Event handlers
function handleRegister(event: CalendarEvent) {
  selectedEvent.value = event;
  showRegistrationModal.value = true;
}

function onRegister(_data: any) {
  showRegistrationModal.value = false;
  selectedEvent.value = null;
}
</script>
