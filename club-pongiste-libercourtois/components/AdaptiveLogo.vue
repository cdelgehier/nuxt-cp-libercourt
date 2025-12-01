<template>
  <img
    :src="logoSrc"
    :alt="altText"
    :class="classes"
    class="transition-opacity duration-300"
  />
</template>

<script setup lang="ts">
interface Props {
  alt?: string;
  classes?: string;
}

const _props = withDefaults(defineProps<Props>(), {
  alt: undefined, // Will use clubName as fallback
  classes: "h-20 w-auto hover:scale-105 transition-transform duration-200",
});

// Get club configuration data
const { data: clubConfig } = await useFetch("/api/club/config");

// Use prop alt if provided, otherwise use club name
const altText = computed(
  () =>
    _props.alt || clubConfig.value?.club?.name || "Club Pongiste Libercourtois",
);

const { $colorMode } = useNuxtApp();

// Compute the logo source based on color mode
const logoSrc = computed(() => {
  return $colorMode.preference === "dark"
    ? "/images/logo-club-white.webp"
    : "/images/logo-club.webp";
});
</script>
