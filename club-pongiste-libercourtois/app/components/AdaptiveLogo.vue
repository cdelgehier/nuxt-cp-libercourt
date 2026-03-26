<template>
  <img
    :src="logoSrc"
    alt="Club Pongiste Libercourtois"
    :class="classes"
    class="transition-opacity duration-300"
    fetchpriority="high"
    loading="eager"
  />
</template>

<script setup lang="ts">
interface Props {
  classes?: string;
}

withDefaults(defineProps<Props>(), {
  classes: "h-20 w-auto hover:scale-105 transition-transform duration-200",
});

const { $colorMode } = useNuxtApp();

const logoSrc = computed(() => {
  return $colorMode.preference === "dark"
    ? "/images/logo-club-white.webp"
    : "/images/logo-club.webp";
});
</script>
