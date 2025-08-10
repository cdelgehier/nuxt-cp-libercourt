<template>
  <header class="nav-club sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <!-- Logo du club -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center">
            <AdaptiveLogo />
          </NuxtLink>
        </div>

        <!-- Navigation principale (desktop) -->
        <nav class="hidden md:flex items-center space-x-8">
          <NuxtLink
            v-for="item in navigation"
            :key="item.href"
            :to="item.href"
            class="nav-link"
            :class="{ 'nav-link-active': $route.path === item.href }"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Boutons d'action -->
        <div class="hidden md:flex items-center space-x-4">
          <ColorModeToggle />
          <UButton to="/contact" color="primary" variant="solid" size="sm">
            Nous rejoindre
          </UButton>
        </div>

        <!-- Menu mobile -->
        <div class="md:hidden flex items-center space-x-2">
          <ColorModeToggle />
          <UButton
            icon="i-heroicons-bars-3"
            variant="ghost"
            color="gray"
            @click="mobileMenuOpen = !mobileMenuOpen"
          />
        </div>
      </div>
    </div>

    <!-- Menu mobile slide -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden"
      :class="[
        $colorMode.preference === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200',
      ]"
      style="
        border-top: 1px solid var(--border-color);
        background-color: var(--bg-secondary);
      "
    >
      <div class="px-2 pt-2 pb-3 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.href"
          :to="item.href"
          class="block px-3 py-2 text-base font-medium transition-colors duration-200"
          :class="[
            $colorMode.preference === 'dark'
              ? 'text-gray-200 hover:text-club-green'
              : 'text-gray-700 hover:text-club-green',
          ]"
          style="color: var(--text-primary)"
          @click="mobileMenuOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
        <div class="pt-4" style="border-top: 1px solid var(--border-color)">
          <UButton
            to="/contact"
            color="primary"
            variant="solid"
            block
            @click="mobileMenuOpen = false"
          >
            Nous rejoindre
          </UButton>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { NavigationItem } from "~/types";

// Mobile menu state
const mobileMenuOpen = ref(false);

// Navigation principale
const navigation: NavigationItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Le Club", href: "/club" },
  { label: "Licenciés", href: "/licencies" },
  { label: "Calendrier", href: "/calendrier" },
  { label: "Horaires & Tarifs", href: "/horaires-tarifs" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

// Fermer le menu mobile lors du changement de route
watch(
  () => mobileMenuOpen.value,
  (isOpen) => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  },
);

// Clean up on unmount
onUnmounted(() => {
  document.body.classList.remove("overflow-hidden");
});
</script>
