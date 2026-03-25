<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
    <!-- Sidebar -->
    <aside class="w-64 flex-shrink-0 bg-club-navy text-white flex flex-col">
      <!-- Logo -->
      <div class="p-6 border-b border-white/10">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-club-yellow font-bold text-xl">CPL</span>
          <span class="text-sm text-gray-300">Administration</span>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="[
            isActive(item.to)
              ? 'bg-club-green text-white'
              : 'text-gray-300 hover:bg-white/10 hover:text-white',
          ]"
        >
          <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Footer sidebar -->
      <div class="p-4 border-t border-white/10 space-y-2">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Retour au site
        </NuxtLink>
        <button
          class="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full"
          @click="logout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header
        class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between"
      >
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ pageTitle }}
        </h1>
        <div class="flex items-center gap-4">
          <ColorModeToggle />
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "AdminLayout" });

const route = useRoute();
const { loggedIn, logout: oidcLogout } = useOidcAuth();

async function logout() {
  if (loggedIn.value) {
    await oidcLogout();
  } else {
    await $fetch("/api/auth/basic-logout", { method: "POST" });
    await navigateTo("/admin/login");
  }
}

const navItems = [
  { to: "/admin", label: "Tableau de bord", icon: "i-heroicons-home" },
  { to: "/admin/faq", label: "FAQ", icon: "i-heroicons-question-mark-circle" },
  {
    to: "/admin/events",
    label: "Événements",
    icon: "i-heroicons-calendar-days",
  },
  { to: "/admin/schedules", label: "Créneaux", icon: "i-heroicons-clock" },
  { to: "/admin/pricing", label: "Tarifs", icon: "i-heroicons-currency-euro" },
  { to: "/admin/sponsors", label: "Sponsors", icon: "i-heroicons-star" },
  {
    to: "/admin/team-members",
    label: "Bureau",
    icon: "i-heroicons-user-group",
  },
  {
    to: "/admin/config",
    label: "Configuration",
    icon: "i-heroicons-cog-6-tooth",
  },
];

const pageTitle = computed(() => {
  const current = navItems.find((item) => item.to === route.path);
  return current?.label ?? "Administration";
});

function isActive(to: string): boolean {
  if (to === "/admin") return route.path === "/admin";
  return route.path.startsWith(to);
}
</script>
