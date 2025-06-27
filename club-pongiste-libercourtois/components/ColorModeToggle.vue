<template>
  <button
    @click="toggleColorMode"
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

<style scoped>
.color-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.color-mode-toggle:hover {
  background-color: var(--club-yellow);
  color: var(--club-navy);
  border-color: var(--club-yellow);
}

.color-mode-toggle:focus {
  outline: 2px solid var(--club-yellow);
  outline-offset: 2px;
}
</style>
