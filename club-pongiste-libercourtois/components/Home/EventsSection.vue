<template>
  <!-- Events section displaying upcoming club events with registration status -->
  <section class="py-16 page-section">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-3xl font-bold adaptive-title">Prochains Événements</h2>
        <UButton to="/calendrier" variant="outline" color="primary">
          Voir tout le calendrier
        </UButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="event in events" :key="event.id" class="card-club">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="getEventTypeClass(event.type)"
              >
                {{ getEventTypeLabel(event.type) }}
              </span>
              <time class="text-sm adaptive-text">
                {{ formatDate(event.date) }}
              </time>
            </div>

            <h3 class="text-lg font-semibold adaptive-title">
              {{ event.title }}
            </h3>
            <p class="adaptive-text text-sm">
              {{ event.description }}
            </p>

            <div
              v-if="event.location"
              class="flex items-center text-sm adaptive-text"
            >
              <UIcon name="i-heroicons-map-pin" class="mr-1" />
              {{ event.location }}
            </div>

            <!-- Registration status indicator -->
            <div class="flex items-center text-xs">
              <UIcon
                :name="
                  event.registrationOpen
                    ? 'i-heroicons-check-circle'
                    : 'i-heroicons-x-circle'
                "
                :class="
                  event.registrationOpen
                    ? 'text-green-500 mr-1'
                    : 'text-red-500 mr-1'
                "
              />
              <span
                :class="
                  event.registrationOpen ? 'text-green-600' : 'text-red-600'
                "
              >
                {{
                  event.registrationOpen
                    ? "Inscriptions ouvertes"
                    : "Inscriptions fermées"
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CalendarEvent } from "~/schemas";

// Accept events as prop from parent component
defineProps<{
  events: CalendarEvent[];
}>();

// Format date to French locale
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Get event type label in French
function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    tournament: "Tournoi",
    stage: "Stage",
    competition: "Compétition",
    meeting: "Réunion",
    training: "Entraînement",
    Tournoi: "Tournoi",
    Stage: "Stage",
    Compétition: "Compétition",
  };
  return labels[type] || type;
}

// Get CSS classes for event type badge
function getEventTypeClass(type: string): string {
  const classes: Record<string, string> = {
    tournament:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
    stage:
      "bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-300",
    competition:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
    meeting:
      "bg-club-navy/10 text-club-navy dark:bg-club-navy/20 dark:text-club-yellow",
    training:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300",
    Tournoi:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
    Stage:
      "bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-300",
    Compétition:
      "bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-300",
  };
  return (
    classes[type] ||
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
  );
}
</script>
