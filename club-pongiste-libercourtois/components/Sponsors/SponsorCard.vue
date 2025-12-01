<template>
  <!-- Single sponsor card with logo and name -->
  <li class="sponsor-item flex-shrink-0">
    <a
      :href="sponsor.website"
      target="_blank"
      rel="noopener noreferrer"
      class="sponsor-link group flex flex-col bg-white dark:bg-gray-800 rounded-lg p-3 hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-lg h-full"
      :aria-label="ariaLabel"
      :title="sponsor.name"
      :tabindex="tabindex"
    >
      <!-- Logo image -->
      <div class="flex items-center justify-center h-16 mb-2">
        <img
          :src="sponsor.logo.replace(/\.(png|jpg|jpeg)$/i, '.webp')"
          :alt="`${sponsor.name} logo`"
          loading="lazy"
          width="180"
          height="64"
          class="max-h-full max-w-full object-contain"
        />
      </div>
      <!-- Sponsor name -->
      <p
        class="text-xs text-center text-gray-700 dark:text-gray-300 font-medium leading-tight line-clamp-2"
      >
        {{ sponsor.name }}
      </p>
    </a>
  </li>
</template>

<script setup lang="ts">
import type { Partner } from "~/schemas";

// Component props
interface Props {
  sponsor: Partner;
  isDuplicate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDuplicate: false,
});

// Accessibility attributes
const ariaLabel = computed(() =>
  props.isDuplicate ? undefined : `Visit ${props.sponsor.name} website`,
);
const tabindex = computed(() => (props.isDuplicate ? -1 : 0));
</script>

<style scoped>
/* Sponsor item fixed size for consistent layout */
.sponsor-item {
  width: 180px;
  height: 110px;
}

/* Responsive: smaller cards on mobile */
@media (max-width: 768px) {
  .sponsor-item {
    width: 140px;
    height: 100px;
  }
}
</style>
