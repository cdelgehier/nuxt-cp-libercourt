<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header de la page -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Licenciés du Club
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Liste des licenciés de la saison en cours
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Statistiques simples -->
      <div class="mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
          <div class="text-2xl font-bold text-club-green">
            {{ filteredLicensees.length }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Total licenciés
          </div>
        </div>
      </div>

      <!-- Recherche simple -->
      <div class="mb-6">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher par nom, prénom ou licence..."
          class="w-full max-w-md mx-auto"
        />
      </div>      <!-- Liste des licenciés -->
      <div v-if="pending" class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-club-green mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Chargement des licenciés...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <UAlert
          color="red"
          icon="i-heroicons-exclamation-triangle"
          title="Erreur"
          :description="error.message || 'Impossible de charger les licenciés'"
        />
      </div>

      <div v-else-if="filteredLicensees.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-user-group" class="text-4xl text-gray-400 mb-4" />
        <p class="text-gray-600 dark:text-gray-400">
          {{ searchQuery ? 'Aucun licencié ne correspond à la recherche' : 'Aucun licencié trouvé' }}
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="licensee in filteredLicensees"
          :key="licensee.id"
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
          @click="openLicenseeDetails(licensee)"
        >
          <!-- Avatar avec classement et info principale -->
          <div class="flex items-center mb-3">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
              getClassificationColor(licensee.clast || 5)
            ]">
              {{ licensee.clast || "NC" }}
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ licensee.firstName }} {{ licensee.lastName }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ getCategoryLabel((licensee as any).cat) }}
              </p>
            </div>
          </div>

          <!-- Numéro de licence -->
          <div class="text-center">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ licensee.licence }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détails du licencié -->
    <UModal v-model="isDetailsModalOpen" :ui="{ width: 'w-full max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div :class="[
                'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg',
                getClassificationColor(selectedLicensee?.clast || 5)
              ]">
                {{ selectedLicensee?.clast || "NC" }}
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ selectedLicensee?.firstName }} {{ selectedLicensee?.lastName }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Licence {{ selectedLicensee?.licence }}
                </p>
              </div>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              @click="isDetailsModalOpen = false"
            />
          </div>
        </template>

        <div v-if="loadingDetails" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-club-green mb-4" />
          <p class="text-gray-600 dark:text-gray-400">Chargement des détails...</p>
        </div>

        <div v-else-if="!licenseeDetails" class="text-center py-8">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-4xl text-red-500 mb-4" />
          <p class="text-red-600 dark:text-red-400">Impossible de charger les détails du licencié</p>
        </div>

        <div v-else class="space-y-4">
          <!-- Informations essentielles -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 text-center">
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400 text-sm">Points</span>
              <template v-if="loadingDetails">
                <p class="font-bold text-lg text-gray-400">...</p>
                <p class="text-xs text-gray-500">Chargement</p>
              </template>
              <template v-else-if="licenseeDetails.licensee?.points && licenseeDetails.licensee.points !== 0">
                <p class="font-bold text-lg text-club-navy">{{ licenseeDetails.licensee.points }}</p>
                <p class="text-xs text-gray-500">Points mensuels</p>
              </template>
              <template v-else-if="licenseeDetails.licensee?.pointm">
                <p class="font-bold text-lg text-club-navy">{{ licenseeDetails.licensee.pointm }}</p>
                <p class="text-xs text-gray-500">Points mensuels</p>
              </template>
              <template v-else>
                <p class="font-bold text-lg text-gray-400">N/A</p>
                <p class="text-xs text-gray-500">Non disponible</p>
              </template>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400 text-sm">Catégorie</span>
              <template v-if="loadingDetails">
                <p class="font-bold text-lg text-gray-400">...</p>
                <p class="text-xs text-gray-500">Chargement</p>
              </template>
              <template v-else>
                <div class="space-y-1">
                  <p class="font-bold text-lg text-purple-600">
                    {{ licenseeDetails.licensee?.categoryDecoded || decodeFfttCategory(licenseeDetails.licensee?.cat || '') }}
                  </p>
                  <span
                    v-if="licenseeDetails.licensee?.cat"
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      getCategoryColor(licenseeDetails.licensee.cat)
                    ]"
                  >
                    {{ getCategoryIcon(licenseeDetails.licensee.cat) }} {{ licenseeDetails.licensee.cat }}
                  </span>
                </div>
              </template>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400 text-sm">Genre</span>
              <p class="font-bold text-lg">
                {{ licenseeDetails.licensee?.sexe === 'F' ? '♀' : licenseeDetails.licensee?.sexe === 'M' ? '♂' : 'N/A' }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Configuration de la page
definePageMeta({
  title: "Licenciés du Club",
  description: "Liste des licenciés du Club Pongiste Libercourtois",
});

// Import FFTT category utilities
const { decodeFfttCategory, getCategoryType, getCategoryColor, getCategoryIcon } = useFfttCategories();

// État des filtres
const searchQuery = ref("");

// Chargement des données
const { data, pending, error } = await useFetch("/api/club/licensees");

// Données des licenciés
const licensees = computed(() => data.value?.licensees || []);

// Filtrage des licenciés
const filteredLicensees = computed(() => {
  let filtered = licensees.value;

  // Filtre par recherche textuelle
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (licensee: any) =>
        licensee.firstName?.toLowerCase().includes(query) ||
        licensee.lastName?.toLowerCase().includes(query) ||
        licensee.licence?.includes(query)
    );
  }

  // Tri par classement décroissant (plus forts en haut) puis alphabétique
  filtered.sort((a: any, b: any) => {
    // Convertir les classements en nombres (valeur par défaut 0 pour les NC)
    const classA = parseInt(a.clast) || 0;
    const classB = parseInt(b.clast) || 0;

    // Tri par classement décroissant (plus haut classement = plus fort)
    if (classA !== classB) {
      return classB - classA; // Ordre décroissant
    }

    // Si même classement, tri alphabétique par nom puis prénom
    if (a.lastName !== b.lastName) {
      return a.lastName.localeCompare(b.lastName);
    }
    return a.firstName.localeCompare(b.firstName);
  });

  return filtered;
});

// Fonction pour afficher les catégories FFTT décodées
function getCategoryLabel(category: string): string {
  // Utilise le système de décodage des catégories FFTT
  return category ? decodeFfttCategory(category) : "";
}

// Function to get color based on FFTT classification (clast)
// Higher numbers = better level = cooler colors (green/blue)
// Lower numbers = beginner level = warmer colors (orange/red)
// Optimized for small clubs where most players are between 5-14
function getClassificationColor(clast: string | number): string {
  // Convert to number, default to 5 (beginner) if not valid
  const classification = typeof clast === 'string' ? parseInt(clast) || 5 : clast;

  // Fine-tuned color scale for small club reality (most players 5-14)
  if (classification <= 5) {
    return 'bg-red-500'; // Beginner level - red
  } else if (classification === 6) {
    return 'bg-orange-500'; // Beginner+ level - orange
  } else if (classification === 7) {
    return 'bg-amber-500'; // Below average level - amber
  } else if (classification === 8) {
    return 'bg-yellow-500'; // Average- level - yellow
  } else if (classification === 9) {
    return 'bg-lime-500'; // Average level - lime
  } else if (classification === 10) {
    return 'bg-green-500'; // Average+ level - green
  } else if (classification === 11) {
    return 'bg-emerald-500'; // Good- level - emerald
  } else if (classification === 12) {
    return 'bg-teal-500'; // Good level - teal
  } else if (classification === 13) {
    return 'bg-cyan-500'; // Good+ level - cyan
  } else if (classification === 14) {
    return 'bg-blue-500'; // Very good level - blue
  } else if (classification >= 15) {
    return 'bg-blue-600'; // Elite level - deep blue
  } else {
    return 'bg-gray-500'; // New player or NC - gray
  }
}

// État pour la modal de détails
const selectedLicensee = ref<any>(null);
const isDetailsModalOpen = ref(false);
const licenseeDetails = ref<any>(null);
const loadingDetails = ref(false);

// Fonction pour ouvrir les détails d'un licencié
async function openLicenseeDetails(licensee: any) {
  selectedLicensee.value = licensee;
  isDetailsModalOpen.value = true;
  loadingDetails.value = true;
  licenseeDetails.value = null;

  try {
    // Call the detailed API to get complete information
    const detailsResponse = await $fetch(`/api/club/licensee/${licensee.licence}`);

    if (detailsResponse.success) {
      licenseeDetails.value = detailsResponse;
    } else {
      // No fallback data invention - show error or empty state
      licenseeDetails.value = null;
    }
  } catch (error) {
    console.error('Error loading licensee details:', error);
    // No fallback data invention - show error or empty state
    licenseeDetails.value = null;
  } finally {
    loadingDetails.value = false;
  }
}

// Métadonnées SEO
useSeoMeta({
  title: "Licenciés du Club Pongiste Libercourtois",
  description: "Liste complète des licenciés du Club Pongiste Libercourtois avec statistiques et filtres de recherche",
  ogTitle: "Licenciés - Club Pongiste Libercourtois",
  ogDescription: "Découvrez tous les membres licenciés de notre club de tennis de table",
});
</script>
