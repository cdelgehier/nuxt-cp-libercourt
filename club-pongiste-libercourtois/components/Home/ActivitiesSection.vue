<template>
  <!-- Activities section displaying all club activities with icons and age groups -->
  <section class="py-16 page-section">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold adaptive-title mb-4">Nos Activités</h2>
        <p class="text-lg adaptive-text max-w-2xl mx-auto">
          Du loisir à la compétition, découvrez toutes nos activités adaptées à
          chaque âge et niveau.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="activity in activities"
          :key="activity.title"
          class="card-club"
        >
          <div class="text-center space-y-4">
            <div
              class="inline-flex items-center justify-center w-16 h-16 bg-club-yellow/10 rounded-full"
            >
              <UIcon :name="activity.icon" class="text-2xl text-club-green" />
            </div>
            <h3 class="text-xl font-semibold adaptive-title">
              {{ activity.title }}
            </h3>
            <p class="text-gray-600">
              {{ activity.description }}
            </p>
            <div class="pt-2">
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-club-green/10 text-club-green"
              >
                {{ activity.ageGroup }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Activity } from "~/schemas";

// Accept activities as prop from parent component
defineProps<{
  activities: Activity[];
}>();
</script>
