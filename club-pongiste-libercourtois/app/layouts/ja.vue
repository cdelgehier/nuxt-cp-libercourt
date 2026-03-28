<template>
  <div class="min-h-screen bg-gray-50">
    <main id="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "JaLayout" });

// Force light mode for JA interface — tablets and older users, no dark mode needed
const colorMode = useColorMode();
const prevPreference = colorMode.preference;
colorMode.preference = "light";
onUnmounted(() => {
  colorMode.preference = prevPreference;
});
</script>
