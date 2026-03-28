<template>
  <button
    class="color-mode-toggle"
    :aria-label="
      $colorMode.preference === 'dark'
        ? 'Activer le mode clair'
        : 'Activer le mode sombre'
    "
    :title="
      $colorMode.preference === 'dark'
        ? 'Activer le mode clair'
        : 'Activer le mode sombre'
    "
    @click="toggleColorMode"
  >
    <Icon
      :name="
        $colorMode.preference === 'dark' ? 'heroicons:sun' : 'heroicons:moon'
      "
      class="w-5 h-5"
    />
  </button>
</template>

<script setup lang="ts">
const { $colorMode } = useNuxtApp();

const toggleColorMode = () => {
  $colorMode.preference = $colorMode.preference === "dark" ? "light" : "dark";
};
</script>
