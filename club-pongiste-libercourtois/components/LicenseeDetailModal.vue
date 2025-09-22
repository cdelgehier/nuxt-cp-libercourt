<template>
  <UModal v-model="isOpen" :ui="{ width: 'w-full max-w-4xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg',
                  getClassificationColor(licensee?.clast || 500),
                ]"
              >
                {{ getDisplayClassification(licensee?.clast) }}
              </div>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ licensee?.firstName }} {{ licensee?.lastName }}
                <span
                  v-if="licensee?.sexe === 'F'"
                  class="ml-2 text-pink-600 dark:text-pink-400"
                  >♀</span
                >
                <span v-else class="ml-2 text-blue-600 dark:text-blue-400"
                  >♂</span
                >
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Licence {{ licensee?.licence }}
              </p>
            </div>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin text-4xl text-club-green mb-4"
        />
        <p class="text-gray-600 dark:text-gray-400">
          Chargement des détails...
        </p>
      </div>

      <div v-else class="space-y-6">
        <!-- Informations essentielles -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 text-center">
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <span class="text-gray-600 dark:text-gray-400 text-sm">Points</span>
            <p class="font-bold text-lg text-club-navy dark:text-blue-400">
              {{ licensee?.points || licensee?.pointm || "N/A" }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{
                licensee?.points || licensee?.pointm
                  ? "Points mensuels"
                  : "Non disponible"
              }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <span class="text-gray-600 dark:text-gray-400 text-sm"
              >Victoires saison</span
            >
            <p class="font-bold text-lg" :class="winrateColor">
              {{ seasonWinrate }}%
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ seasonMatches.length }} match{{
                seasonMatches.length !== 1 ? "s" : ""
              }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <span class="text-gray-600 dark:text-gray-400 text-sm"
              >Catégorie</span
            >
            <p class="font-bold text-lg text-purple-600 dark:text-purple-400">
              {{ decodeFfttCategory(licensee?.cat || "") || "N/A" }}
            </p>
          </div>
        </div>

        <!-- Graphique d'évolution des points -->
        <div
          v-if="rankingHistory && rankingHistory.length > 0"
          class="bg-white dark:bg-gray-800 p-6 rounded-lg border"
        >
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Évolution des points
          </h4>
          <div class="h-64">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Derniers matchs -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            10 derniers matchs
          </h4>

          <div v-if="loadingMatches" class="text-center py-4">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin text-2xl text-club-green mb-2"
            />
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Chargement des matchs...
            </p>
          </div>

          <div
            v-else-if="!matches || matches.length === 0"
            class="text-center py-8"
          >
            <UIcon
              name="i-heroicons-information-circle"
              class="text-3xl text-gray-400 mb-3"
            />
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Aucun match trouvé
            </p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(dateGroup, date) in groupedMatches"
              :key="date"
              class="space-y-2"
            >
              <!-- Date header -->
              <div class="flex items-center">
                <div
                  class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"
                ></div>
                <h5
                  class="ml-3 text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {{ formatDate(date) }}
                </h5>
                <div class="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {{ dateGroup.length }} match{{
                    dateGroup.length > 1 ? "s" : ""
                  }}
                </div>
              </div>

              <!-- Matches for this date -->
              <div class="ml-5 space-y-2">
                <div
                  v-for="(match, index) in dateGroup"
                  :key="index"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4"
                  :class="
                    match.victoire === 'V'
                      ? 'border-green-500'
                      : 'border-red-500'
                  "
                >
                  <div class="flex items-center space-x-3">
                    <div
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold',
                        match.victoire === 'V' ? 'bg-green-500' : 'bg-red-500',
                      ]"
                    >
                      {{ match.victoire === "V" ? "✓" : "✗" }}
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ formatPlayerName(match.nom) }}
                        </p>
                        <span
                          class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                        >
                          {{ match.classement }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {{ match.epreuve }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface PlayerMatch {
  date: string;
  nom: string;
  classement: string;
  epreuve: string;
  victoire: string;
  forfait: string;
}

interface RankingHistory {
  echelon: string;
  place: string;
  point: string;
  saison: string;
  phase: string;
}

interface Licensee {
  licence: string;
  firstName: string;
  lastName: string;
  sexe: string;
  cat: string;
  clast: string;
  points?: number;
  pointm?: string;
}

interface Props {
  modelValue: boolean;
  licensee: Licensee | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

// Import utilities
const { decodeFfttCategory, getAgeGroup } = useFfttCategories();

// Modal state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Data state
const loading = ref(false);
const loadingMatches = ref(false);
const matches = ref<PlayerMatch[]>([]);
const rankingHistory = ref<RankingHistory[]>([]);

// Watch for licensee changes to load data
watch(
  () => props.licensee,
  async (newLicensee) => {
    if (newLicensee && isOpen.value) {
      await loadLicenseeData(newLicensee.licence);
    }
  },
);

// Watch for modal open to load data
watch(isOpen, async (newOpen) => {
  if (newOpen && props.licensee) {
    await loadLicenseeData(props.licensee.licence);
  }
});

// Load licensee data
async function loadLicenseeData(licence: string) {
  loading.value = true;
  loadingMatches.value = true;

  try {
    // Load matches and ranking history in parallel
    const [matchesResponse, historyResponse] = await Promise.all([
      $fetch(`/api/licensee/${licence}/matches`),
      $fetch(`/api/licensee/${licence}/ranking-history`),
    ]);

    console.log("Matches response for licence", licence, ":", matchesResponse);
    console.log("History response for licence", licence, ":", historyResponse);

    if (matchesResponse.success && "data" in matchesResponse) {
      matches.value = matchesResponse.data || [];
      console.log("Loaded matches:", matches.value.length, "matches found");
    } else {
      console.error(
        "Failed to load matches:",
        "error" in matchesResponse ? matchesResponse.error : "Unknown error",
      );
      matches.value = [];
    }

    if (historyResponse.success && "data" in historyResponse) {
      rankingHistory.value = historyResponse.data || [];
      console.log(
        "Loaded ranking history:",
        rankingHistory.value.length,
        "entries found",
      );
    } else {
      console.error(
        "Failed to load ranking history:",
        "error" in historyResponse ? historyResponse.error : "Unknown error",
      );
      rankingHistory.value = [];
    }
  } catch (error) {
    console.error("Error loading licensee data:", error);
    matches.value = [];
    rankingHistory.value = [];
  } finally {
    loading.value = false;
    loadingMatches.value = false;
  }
}

// Calculate season winrate (September to July of next year)
const seasonMatches = computed(() => {
  if (!matches.value || matches.value.length === 0) {
    return [];
  }

  // Current season: September 2025 to July 2026
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

  // Determine season start year (if we're before September, we're in previous season)
  const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  const seasonStart = new Date(seasonStartYear, 8, 1); // September 1st (month 8 = September)
  const seasonEnd = new Date(seasonStartYear + 1, 6, 31); // July 31st of next year (month 6 = July)

  return matches.value.filter((match) => {
    const matchDate = parseDate(match.date);
    return matchDate >= seasonStart && matchDate <= seasonEnd;
  });
});

const seasonWinrate = computed(() => {
  if (seasonMatches.value.length === 0) {
    return "--";
  }

  const victories = seasonMatches.value.filter(
    (match) => match.victoire === "V",
  ).length;
  const winrate = Math.round((victories / seasonMatches.value.length) * 100);
  return winrate;
});

const winrateColor = computed(() => {
  const rate =
    typeof seasonWinrate.value === "number" ? seasonWinrate.value : 0;

  if (rate >= 70) {
    return "text-green-600 dark:text-green-400";
  } else if (rate >= 50) {
    return "text-blue-600 dark:text-blue-400";
  } else if (rate >= 30) {
    return "text-orange-600 dark:text-orange-400";
  } else {
    return "text-red-600 dark:text-red-400";
  }
});

// Group matches by date
const groupedMatches = computed(() => {
  if (!matches.value || matches.value.length === 0) {
    return {};
  }

  // Sort matches by date (most recent first)
  const sortedMatches = [...matches.value].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  // Group by date
  const grouped = sortedMatches.reduce(
    (acc, match) => {
      const date = match.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(match);
      return acc;
    },
    {} as Record<string, PlayerMatch[]>,
  );

  return grouped;
});

// Chart data
const chartData = computed(() => {
  if (!rankingHistory.value || rankingHistory.value.length === 0) {
    return {
      labels: [],
      datasets: [],
    };
  }

  // Sort by season and phase
  const sortedHistory = [...rankingHistory.value].sort((a, b) => {
    if (a.saison !== b.saison) {
      return a.saison.localeCompare(b.saison);
    }
    return parseInt(a.phase) - parseInt(b.phase);
  });

  const labels = sortedHistory.map((h) => `${h.saison} P${h.phase}`);
  const points = sortedHistory.map((h) => parseInt(h.point) || 0);

  return {
    labels,
    datasets: [
      {
        label: "Points",
        data: points,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "rgb(59, 130, 246)",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: false,
      grid: {
        color: "rgba(156, 163, 175, 0.1)",
      },
      ticks: {
        color: "rgb(156, 163, 175)",
      },
    },
    x: {
      grid: {
        color: "rgba(156, 163, 175, 0.1)",
      },
      ticks: {
        color: "rgb(156, 163, 175)",
        maxRotation: 45,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: "index" as const,
      intersect: false,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "white",
      bodyColor: "white",
      borderColor: "rgb(59, 130, 246)",
      borderWidth: 1,
    },
  },
  elements: {
    line: {
      borderWidth: 2,
    },
  },
}));

// Utility functions
function getDisplayClassification(
  clast: string | number | null | undefined,
): string {
  if (!clast) return "NC";

  const points = typeof clast === "string" ? parseInt(clast) : clast;
  if (!points || points === 0) return "NC";

  if (points >= 100) {
    return Math.floor(points / 100).toString();
  }

  return points.toString();
}

function getClassificationColor(clast: string | number): string {
  let classification: number;

  if (typeof clast === "string") {
    const points = parseInt(clast) || 500;
    classification = Math.floor(points / 100);
  } else {
    classification = clast >= 100 ? Math.floor(clast / 100) : clast;
  }

  if (classification <= 5) {
    return "bg-red-500";
  } else if (classification === 6) {
    return "bg-orange-500";
  } else if (classification === 7) {
    return "bg-amber-500";
  } else if (classification === 8) {
    return "bg-yellow-500";
  } else if (classification === 9) {
    return "bg-lime-500";
  } else if (classification === 10) {
    return "bg-green-500";
  } else if (classification === 11) {
    return "bg-emerald-500";
  } else if (classification === 12) {
    return "bg-teal-500";
  } else if (classification === 13) {
    return "bg-cyan-500";
  } else if (classification === 14) {
    return "bg-sky-500";
  } else if (classification >= 15) {
    return "bg-blue-500";
  } else {
    return "bg-gray-500";
  }
}

function parseDate(dateString: string): Date {
  if (!dateString) return new Date();

  try {
    // Try parsing as DD/MM/YYYY (FFTT format)
    const parts = dateString.split("/");
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0]),
      );
    }
    // Fallback to standard Date parsing
    return new Date(dateString);
  } catch {
    return new Date();
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return "N/A";

  try {
    const date = parseDate(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatPlayerName(fullName: string): string {
  if (!fullName) return "N/A";

  // Convert "DUPONT Pierre" to "Pierre DUPONT" format
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) {
    const lastName = parts[0];
    const firstName = parts.slice(1).join(" ");
    return `${firstName} ${lastName}`;
  }

  return fullName;
}
</script>
