<template>
  <img
    src="/images/logo-club.webp"
    alt="Club Pongiste Libercourtois"
    :class="classes"
    class="transition-opacity duration-300 dark:hidden"
    fetchpriority="high"
    loading="eager"
  />
  <img
    src="/images/logo-club-white.webp"
    alt="Club Pongiste Libercourtois"
    :class="classes"
    class="transition-opacity duration-300 hidden dark:block"
  />
</template>

<script setup lang="ts">
interface Props {
  classes?: string;
}

withDefaults(defineProps<Props>(), {
  classes: "h-20 w-auto hover:scale-105 transition-transform duration-200",
});
</script>
