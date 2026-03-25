<template>
  <div class="space-y-6">
    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{
            stat.label
          }}</span>
          <UIcon :name="stat.icon" class="w-5 h-5 text-club-green" />
        </div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ stat.value }}
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Accès rapides
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <NuxtLink
          v-for="link in quickLinks"
          :key="link.to"
          :to="link.to"
          class="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-club-green hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center"
        >
          <UIcon :name="link.icon" class="w-6 h-6 text-club-green" />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            link.label
          }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "AdminIndexPage" });
definePageMeta({ layout: "admin", middleware: "admin" });

useSeoMeta({ title: "Admin — Tableau de bord", robots: "noindex,nofollow" });

const { data: faqs } = await useFetch("/api/club/faq");
const { data: events } = await useFetch("/api/events/calendar");

const stats = computed(() => [
  {
    label: "FAQ",
    value: faqs.value?.faqs?.length ?? "—",
    icon: "i-heroicons-question-mark-circle",
  },
  {
    label: "Événements",
    value: events.value?.events?.length ?? "—",
    icon: "i-heroicons-calendar-days",
  },
  {
    label: "Statut DB",
    value: "Neon",
    icon: "i-heroicons-circle-stack",
  },
  {
    label: "Auth",
    value: "OIDC",
    icon: "i-heroicons-shield-check",
  },
]);

const quickLinks = [
  {
    to: "/admin/faq",
    label: "Gérer FAQ",
    icon: "i-heroicons-question-mark-circle",
  },
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
</script>
