<template>
  <img
    :src="logoSrc"
    :alt="alt"
    :class="classes"
    class="transition-opacity duration-300"
  />
</template>

<script setup lang="ts">
interface Props {
  alt?: string;
  classes?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "Club Pongiste Libercourtois",
  classes: "h-20 w-auto hover:scale-105 transition-transform duration-200",
});

const { $colorMode } = useNuxtApp();

// Compute the logo source based on color mode
const logoSrc = computed(() => {
  return $colorMode.preference === "dark"
    ? "/images/logo-club-white.png"
    : "/images/logo-club.png";
});
</script>
