<template>
  <div>
    <!-- Intermediate Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-3xl font-bold text-white sm:text-4xl mb-4">
            <span class="text-club-yellow">Administration</span>
            du Club
          </h1>
          <p class="text-xl text-gray-200 max-w-3xl mx-auto">
            Statistiques et gestion du Club Pongiste Libercourtois
          </p>
        </div>
      </div>
    </section>

    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Statistiques principales -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card-club text-center">
          <h3 class="text-lg font-semibold text-club-navy mb-2">Licenciés</h3>
          <div class="text-3xl font-bold text-club-green">
            {{ pending ? "Chargement..." : clubStats?.licencies }}
          </div>
          <p class="text-sm text-gray-600 mt-2">Mis à jour en temps réel</p>
        </div>

        <div class="card-club text-center">
          <h3 class="text-lg font-semibold text-club-navy mb-2">Équipes</h3>
          <div class="text-3xl font-bold text-club-green">
            {{ pending ? "Chargement..." : clubStats?.equipes }}
          </div>
          <p class="text-sm text-gray-600 mt-2">Championnat en cours</p>
        </div>

        <div class="card-club text-center">
          <h3 class="text-lg font-semibold text-club-navy mb-2">
            Années d'existence
          </h3>
          <div class="text-3xl font-bold text-club-green">
            {{ pending ? "Chargement..." : clubStats?.annees }}
          </div>
          <p class="text-sm text-gray-600 mt-2">Depuis 1970</p>
        </div>
      </div>

      <!-- Update information -->
      <div class="card-club mb-8">
        <h3 class="text-lg font-semibold text-club-navy mb-4">
          Informations de synchronisation
        </h3>

        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Dernière mise à jour :</span>
            <span class="font-mono text-sm">
              {{
                clubStats?.lastUpdated
                  ? formatDate(new Date(clubStats.lastUpdated))
                  : "N/A"
              }}
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-600">Source des données :</span>
            <span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              PingPocket FFTT
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-600">Statut :</span>
            <span
              class="text-sm"
              :class="pending ? 'text-orange-600' : 'text-green-600'"
            >
              {{ pending ? "Synchronisation..." : "À jour" }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-club">
        <h3 class="text-lg font-semibold text-club-navy mb-4">Actions</h3>

        <div class="space-y-4">
          <UButton
            @click="refresh()"
            :loading="pending"
            color="primary"
            icon="i-heroicons-arrow-path"
          >
            Actualiser les données
          </UButton>

          <div class="text-sm text-gray-600">
            <p>• Les données sont automatiquement mises en cache pendant 24h</p>
            <p>• Utiliser "Actualiser" uniquement si nécessaire</p>
            <p>
              • Source :
              <a
                href="https://www.pingpocket.fr/app/fftt/clubs/07620112"
                target="_blank"
                class="text-club-green hover:underline"
                >PingPocket FFTT</a
              >
            </p>
          </div>
        </div>
      </div>

      <!-- Retour -->
      <div class="mt-8">
        <UButton to="/" variant="outline" icon="i-heroicons-arrow-left">
          Retour à l'accueil
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Configuration SEO
useSeoMeta({
  title: "Administration",
  description: "Tableau de bord administrateur pour les statistiques du club",
  robots: "noindex,nofollow",
});

// Interface for club statistics
interface ClubStats {
  licencies: number;
  equipes: number;
  annees: number;
  lastUpdated: string;
}

// Fetch club statistics from API
const {
  data: clubStats,
  pending,
  refresh,
} = await useLazyFetch<ClubStats>("/api/club/stats", {
  key: "admin-club-stats",
});

// Utility to format dates
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
</script>
