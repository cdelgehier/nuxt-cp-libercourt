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
      <!-- Statistiques avec répartition par genre et âge -->
      <div class="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
        >
          <div class="text-2xl font-bold text-teal-700">
            {{ filteredLicensees.length }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Total licenciés
          </div>
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
        >
          <div class="text-2xl font-bold text-pink-600">
            {{
              filteredLicensees.filter((l) => (l as any).sexe === "F").length
            }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">♀ Femmes</div>
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
        >
          <div class="text-2xl font-bold text-blue-600">
            {{
              filteredLicensees.filter((l) => (l as any).sexe === "M").length
            }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">♂ Hommes</div>
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
        >
          <div class="text-2xl font-bold text-green-600">
            {{
              filteredLicensees.filter(
                (l) => getAgeGroup((l as any).cat || "") === "junior",
              ).length
            }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">🧸 Juniors</div>
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
        >
          <div class="text-2xl font-bold text-purple-600">
            {{
              filteredLicensees.filter(
                (l) => getAgeGroup((l as any).cat || "") === "adult",
              ).length
            }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">🐻 Adultes</div>
        </div>
      </div>

      <!-- Filtres de recherche, genre et âge -->
      <div class="mb-6 space-y-4">
        <!-- Barre de recherche -->
        <div class="flex justify-center">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Rechercher par nom, prénom ou licence..."
            class="w-full max-w-md"
          />
        </div>

        <!-- Filtres par boutons -->
        <div
          class="flex flex-col sm:flex-row gap-6 items-center justify-center"
        >
          <!-- Filtre par genre -->
          <div class="flex flex-col items-center">
            <span
              class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Genre</span
            >
            <div class="flex gap-2">
              <UButton
                :variant="genderFilter === 'all' ? 'solid' : 'outline'"
                :color="genderFilter === 'all' ? 'primary' : 'gray'"
                size="sm"
                @click="genderFilter = 'all'"
              >
                Tous
              </UButton>
              <UButton
                :variant="genderFilter === 'F' ? 'solid' : 'outline'"
                :color="genderFilter === 'F' ? 'pink' : 'gray'"
                size="sm"
                @click="genderFilter = 'F'"
              >
                ♀ Femmes
              </UButton>
              <UButton
                :variant="genderFilter === 'M' ? 'solid' : 'outline'"
                :color="genderFilter === 'M' ? 'blue' : 'gray'"
                size="sm"
                @click="genderFilter = 'M'"
              >
                ♂ Hommes
              </UButton>
            </div>
          </div>

          <!-- Filtre par âge -->
          <div class="flex flex-col items-center">
            <span
              class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Âge</span
            >
            <div class="flex gap-2">
              <UButton
                :variant="ageFilter === 'all' ? 'solid' : 'outline'"
                :color="ageFilter === 'all' ? 'primary' : 'gray'"
                size="sm"
                @click="ageFilter = 'all'"
              >
                Tous âges
              </UButton>
              <UButton
                :variant="ageFilter === 'junior' ? 'solid' : 'outline'"
                :color="ageFilter === 'junior' ? 'green' : 'gray'"
                size="sm"
                @click="ageFilter = 'junior'"
              >
                🧸 Juniors
              </UButton>
              <UButton
                :variant="ageFilter === 'adult' ? 'solid' : 'outline'"
                :color="ageFilter === 'adult' ? 'purple' : 'gray'"
                size="sm"
                @click="ageFilter = 'adult'"
              >
                🐻 Adultes
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des licenciés -->
      <div v-if="pending" class="text-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin text-4xl text-club-green mb-4"
        />
        <p class="text-gray-600 dark:text-gray-400">
          Chargement des licenciés...
        </p>
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
        <UIcon
          name="i-heroicons-user-group"
          class="text-4xl text-gray-400 mb-4"
        />
        <p class="text-gray-600 dark:text-gray-400">
          {{
            searchQuery
              ? "Aucun licencié ne correspond à la recherche"
              : "Aucun licencié trouvé"
          }}
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="licensee in filteredLicensees"
          :key="(licensee as any).id"
          :class="[
            'bg-white dark:bg-gray-800 border rounded-lg shadow p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-105',
            // Different border colors for gender
            (licensee as any).sexe === 'F'
              ? 'border-pink-300 dark:border-pink-600 bg-gradient-to-br from-pink-50 to-white dark:from-pink-950/20 dark:to-gray-800'
              : 'border-gray-200 dark:border-gray-700',
          ]"
          @click="openLicenseeDetails(licensee)"
        >
          <!-- Avatar avec classement et info principale -->
          <div class="flex items-center mb-3">
            <div class="relative">
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                  getClassificationColor((licensee as any).clast || 500),
                ]"
              >
                {{ getDisplayClassification((licensee as any).clast) }}
              </div>
            </div>
            <div class="ml-3 flex-1">
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ (licensee as any).firstName }}
                {{ (licensee as any).lastName }}
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ getCategoryLabel((licensee as any).cat) }}
                <span
                  v-if="(licensee as any).sexe === 'F'"
                  class="ml-1 text-pink-600 dark:text-pink-400"
                  >♀</span
                >
                <span v-else class="ml-1 text-blue-600 dark:text-blue-400"
                  >♂</span
                >
              </p>
            </div>
          </div>

          <!-- Numéro de licence -->
          <div class="text-center">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{
              (licensee as any).licence
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détails du licencié avec graphique et matchs -->
    <LicenseeDetailModal
      v-model="isDetailsModalOpen"
      :licensee="selectedLicensee"
    />
  </div>
</template>

<script setup lang="ts">
// Configuration de la page
definePageMeta({
  title: "Licenciés du Club",
  description: "Liste des licenciés du Club Pongiste Libercourtois",
});

// Import FFTT category utilities
const { decodeFfttCategory, getAgeGroup } = useFfttCategories();

// État des filtres
const searchQuery = ref("");
const genderFilter = ref("all");
const ageFilter = ref("all");

// useLazyFetch to avoid blocking SSR (SmartPing is slow)
const { data, pending, error } = useLazyFetch("/api/club/licensees");

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
        licensee.licence?.includes(query),
    );
  }

  // Filtre par genre
  if (genderFilter.value !== "all") {
    filtered = filtered.filter(
      (licensee: any) => licensee.sexe === genderFilter.value,
    );
  }

  // Filtre par âge
  if (ageFilter.value !== "all") {
    filtered = filtered.filter((licensee: any) => {
      const ageGroup = getAgeGroup(licensee.cat || "");
      return ageGroup === ageFilter.value;
    });
  }

  // Tri par classement décroissant (plus forts en haut) puis alphabétique
  filtered.sort((a: any, b: any) => {
    // Convertir les classements en nombres (valeur par défaut 0 pour les NC)
    const classA = parseInt(a.clast) || 0;
    const classB = parseInt(b.clast) || 0;

    // Tri par classement décroissant (plus haut classement = plus fort)
    if (classA !== classB) {
      return classB - classA;
    }

    // Si même classement, tri alphabétique par nom de famille
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

// Function to convert FFTT points to classification display
// Converts 500 -> "5", 600 -> "6", etc.
function getDisplayClassification(
  clast: string | number | null | undefined,
): string {
  if (!clast) return "NC";

  const points = typeof clast === "string" ? parseInt(clast) : clast;
  if (!points || points === 0) return "NC";

  // Convert FFTT points to classification
  if (points >= 100) {
    return Math.floor(points / 100).toString();
  }

  // If it's already in classification format, return as is
  return points.toString();
}

// Function to get color based on FFTT classification (clast)
// Higher numbers = better level = cooler colors (green/blue)
// Lower numbers = beginner level = warmer colors (orange/red)
// Handles FFTT points format (500, 600, etc.) by converting to classification (5, 6, etc.)
function getClassificationColor(clast: string | number): string {
  // Convert FFTT points to classification by dividing by 100
  let classification: number;

  if (typeof clast === "string") {
    const points = parseInt(clast) || 500; // Default to 500 (= classement 5) if invalid
    classification = Math.floor(points / 100);
  } else {
    // If it's already a number, check if it's points format (>= 100) or classification format
    classification = clast >= 100 ? Math.floor(clast / 100) : clast;
  }

  // Fine-tuned color scale for small club reality (most players 5-14)
  if (classification <= 5) {
    return "bg-red-700"; // Beginner level - red
  } else if (classification === 6) {
    return "bg-orange-700"; // Beginner+ level - orange
  } else if (classification === 7) {
    return "bg-amber-700"; // Below average level - amber
  } else if (classification === 8) {
    return "bg-yellow-700"; // Average- level - yellow
  } else if (classification === 9) {
    return "bg-lime-700"; // Average level - lime
  } else if (classification === 10) {
    return "bg-green-700"; // Average+ level - green
  } else if (classification === 11) {
    return "bg-emerald-700"; // Good- level - emerald
  } else if (classification === 12) {
    return "bg-teal-700"; // Good level - teal
  } else if (classification === 13) {
    return "bg-cyan-700"; // Good+ level - cyan
  } else if (classification === 14) {
    return "bg-sky-700"; // Strong level - sky
  } else if (classification >= 15) {
    return "bg-blue-700"; // Elite level - blue
  } else {
    return "bg-gray-700"; // Unknown/fallback - gray
  }
}

// État du modal de détails
const isDetailsModalOpen = ref(false);
const selectedLicensee = ref<any>(null);

// Fonction pour ouvrir les détails d'un licencié
function openLicenseeDetails(licensee: any) {
  selectedLicensee.value = licensee;
  isDetailsModalOpen.value = true;
}
</script>
