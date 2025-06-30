<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Navigation -->
    <AppHeader />

    <!-- Main Content -->
    <main id="main-content" class="min-h-screen">
      <slot />
    </main>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
// This layout will be used by default for all pages
defineOptions({
  name: "DefaultLayout",
});
</script>
