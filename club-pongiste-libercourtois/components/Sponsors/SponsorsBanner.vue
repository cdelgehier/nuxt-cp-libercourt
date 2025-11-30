<template>
  <!--
    Sponsors Banner Component
    Displays partner/sponsor logos in an infinite scrolling animation
    Uses duplicate lists for seamless loop effect
  -->
  <div class="sponsors-banner-wrapper bg-club-navy dark:bg-gray-900 py-12">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Section header -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-white mb-2">Nos Partenaires</h2>
        <p class="text-gray-300 dark:text-gray-400">
          Ils nous font confiance et nous soutiennent dans notre développement
        </p>
      </div>

      <!-- Scrolling container with gradient mask -->
      <div
        class="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]"
      >
        <!-- Generate 2 identical lists for seamless infinite scroll -->
        <ul
          v-for="index in 2"
          :key="index"
          class="flex items-center justify-center md:justify-start gap-4 animate-infinite-scroll will-change-transform"
          :class="{ 'ml-4': index === 2 }"
          :aria-hidden="index === 2"
        >
          <SponsorsSponsorCard
            v-for="sponsor in sponsors"
            :key="`${index}-${sponsor.id}`"
            :sponsor="sponsor"
            :is-duplicate="index === 2"
          />
        </ul>
      </div>

      <!-- Info text -->
      <p
        class="text-center text-sm text-gray-400 dark:text-gray-500 mt-6 italic"
      >
        Cliquez sur un logo pour visiter le site
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Partner } from "~/schemas";

// Component props - receives sponsors list from parent
interface Props {
  sponsors: Partner[];
}

defineProps<Props>();
</script>
