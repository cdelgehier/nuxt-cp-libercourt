<template>
  <div
    class="event-card overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200"
  >
    <!-- Event Type Badge -->
    <div class="px-4 py-3 event-card-header">
      <div class="flex items-center justify-between">
        <span
          :class="eventTypeBadgeClass"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        >
          {{ eventTypeLabel }}
        </span>
        <span v-if="event.price" class="text-sm font-semibold event-card-price">
          {{ event.price }}€
        </span>
      </div>
    </div>

    <div class="px-4 py-4">
      <!-- Title -->
      <h3 class="text-lg font-semibold event-card-title mb-2">
        {{ event.title }}
      </h3>

      <!-- Description -->
      <p
        v-if="event.description"
        class="text-sm event-card-text mb-3 line-clamp-2"
      >
        {{ event.description }}
      </p>

      <!-- Event Details -->
      <div class="space-y-2 mb-4">
        <!-- Date and Time -->
        <div class="flex items-center text-sm event-card-text">
          <svg
            class="w-4 h-4 mr-2 event-card-icon"
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
          <span>{{ formatDate(event.date) }}</span>
          <span v-if="event.time" class="ml-2">à {{ event.time }}</span>
        </div>

        <!-- Location -->
        <div
          v-if="event.location"
          class="flex items-center text-sm event-card-text"
        >
          <svg
            class="w-4 h-4 mr-2 event-card-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {{ event.location }}
        </div>

        <!-- Participants -->
        <div
          v-if="event.maxParticipants"
          class="flex items-center text-sm event-card-text"
        >
          <svg
            class="w-4 h-4 mr-2 event-card-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {{ event.currentParticipants }}/{{ event.maxParticipants }}
          participants
        </div>

        <!-- Registration Deadline -->
        <div
          v-if="event.registrationDeadline && event.registrationOpen"
          class="flex items-center text-sm text-orange-600"
        >
          <svg
            class="w-4 h-4 mr-2 text-orange-400"
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
          Inscription jusqu'au {{ formatDate(event.registrationDeadline) }}
        </div>
      </div>

      <!-- Status and Actions -->
      <div v-if="!past" class="flex items-center justify-between">
        <!-- Registration Status -->
        <div class="flex items-center">
          <span
            v-if="event.registrationOpen"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >
            <div class="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5" />
            Inscriptions ouvertes
          </span>
          <span
            v-else-if="event.status === 'upcoming'"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            <div class="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5" />
            Inscriptions fermées
          </span>
          <span
            v-else-if="event.status === 'cancelled'"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
          >
            <div class="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5" />
            Annulé
          </span>
        </div>

        <!-- Register Button -->
        <button
          v-if="event.registrationOpen && canRegister"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          @click="$emit('register', event)"
        >
          <svg
            class="w-4 h-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          S'inscrire
        </button>

        <span
          v-else-if="event.registrationOpen && !canRegister"
          class="text-sm text-red-600 font-medium"
        >
          Complet
        </span>
      </div>

      <!-- Past Event Summary -->
      <div
        v-else
        class="flex items-center justify-between text-sm text-gray-500"
      >
        <span class="inline-flex items-center">
          <svg
            class="w-4 h-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Événement terminé
        </span>
        <span v-if="event.currentParticipants">
          {{ event.currentParticipants }} participant{{
            event.currentParticipants > 1 ? "s" : ""
          }}
        </span>
      </div>

      <!-- Contact Info -->
      <div v-if="event.contact" class="mt-3 pt-3 border-t border-gray-100">
        <div class="flex items-center text-xs text-gray-500">
          <svg
            class="w-3 h-3 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Contact: {{ event.contact.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from "~/types";

interface Props {
  event: CalendarEvent;
  past?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  past: false,
});

defineEmits<{
  register: [event: CalendarEvent];
}>();

// Event type configurations using club colors
const eventTypeConfig = {
  tournament: {
    label: "Tournoi",
    class: "bg-accent-50 text-accent-600",
  },
  stage: {
    label: "Stage",
    class:
      "bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-300",
  },
  competition: {
    label: "Compétition",
    class:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
  },
  meeting: {
    label: "Réunion",
    class:
      "bg-club-navy/10 text-club-navy dark:bg-club-navy/20 dark:text-club-yellow",
  },
  training: {
    label: "Entraînement",
    class:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300",
  },
  other: {
    label: "Autre",
    class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
};

// Computed properties
const eventTypeLabel = computed(
  () => eventTypeConfig[props.event.type]?.label || "Événement",
);
const eventTypeBadgeClass = computed(
  () => eventTypeConfig[props.event.type]?.class || "bg-gray-100 text-gray-800",
);

const canRegister = computed(() => {
  if (!props.event.maxParticipants) return true;
  return props.event.currentParticipants < props.event.maxParticipants;
});

// Utilities
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Styles adaptatifs pour les modes clair/sombre */
.event-card {
  background-color: var(--card-bg);
  color: var(--text-primary);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.event-card-header {
  border-bottom: 1px solid var(--border-color);
}

.event-card-title {
  color: var(--text-primary);
}

.event-card-text {
  color: var(--text-secondary);
}

.event-card-price {
  color: var(--text-primary);
}

.event-card-icon {
  color: var(--text-secondary);
  opacity: 0.7;
}
</style>
