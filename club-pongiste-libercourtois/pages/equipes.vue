<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header de la page -->
    <div class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Équipes & Rencontres
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Calendrier des matchs et résultats de nos équipes
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="teamsLoading" class="text-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="mx-auto h-12 w-12 text-club-green animate-spin"
        />
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Chargement des équipes...
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="teamsError" class="text-center py-12">
        <div
          class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 max-w-md mx-auto"
        >
          <svg
            class="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01"
            />
          </svg>
          <h3 class="mt-2 text-lg font-medium text-red-800 dark:text-red-200">
            Erreur de chargement
          </h3>
          <p class="mt-1 text-sm text-red-600 dark:text-red-300">
            {{ teamsError }}
          </p>
        </div>
      </div>

      <!-- Statistiques des équipes -->
      <div
        v-else-if="teams?.success && teams.data && teams.data.length > 0"
        class="mb-8"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div
            class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
          >
            <div class="text-2xl font-bold text-club-green">
              {{ teams?.data?.length || 0 }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Total équipes
            </div>
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
          >
            <div class="text-2xl font-bold text-blue-600">
              {{ seniorTeams.length }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              🐻 Adultes
            </div>
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
          >
            <div class="text-2xl font-bold text-green-600">
              {{ juniorTeams.length }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              🧸 Juniors
            </div>
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center"
          >
            <div class="text-2xl font-bold text-purple-600">
              {{ totalMatches }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              🏓 Rencontres
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="mb-6 flex flex-wrap gap-2">
          <UButton
            :variant="selectedCategory === 'all' ? 'solid' : 'outline'"
            color="primary"
            @click="selectedCategory = 'all'"
          >
            Toutes les équipes
          </UButton>
          <UButton
            :variant="selectedCategory === 'seniors' ? 'solid' : 'outline'"
            color="blue"
            @click="selectedCategory = 'seniors'"
          >
            Adultes ({{ seniorTeams.length }})
          </UButton>
          <UButton
            :variant="selectedCategory === 'juniors' ? 'solid' : 'outline'"
            color="green"
            @click="selectedCategory = 'juniors'"
          >
            Juniors ({{ juniorTeams.length }})
          </UButton>
        </div>

        <!-- Liste des équipes -->
        <div class="space-y-6">
          <div
            v-for="team in filteredTeams"
            :key="team.idequipe"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <!-- En-tête de l'équipe -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <div>
                  <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {{ team.libequipe }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ team.libdivision }}
                  </p>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2"
                    :class="getTeamTypeClass(team)"
                  >
                    {{ getTeamType(team) }}
                  </span>
                </div>
                <UButton
                  :variant="
                    expandedTeams.includes(team.idequipe) ? 'solid' : 'outline'
                  "
                  @click="toggleTeamExpansion(team.idequipe)"
                  size="sm"
                >
                  <UIcon
                    :name="
                      expandedTeams.includes(team.idequipe)
                        ? 'i-heroicons-chevron-up'
                        : 'i-heroicons-chevron-down'
                    "
                    class="w-4 h-4"
                  />
                  {{
                    expandedTeams.includes(team.idequipe)
                      ? "Masquer"
                      : "Voir les matchs"
                  }}
                </UButton>
              </div>
            </div>

            <!-- Matchs de l'équipe (expandable) -->
            <div v-if="expandedTeams.includes(team.idequipe)" class="p-6">
              <!-- Loading des matchs -->
              <div
                v-if="loadingMatches[team.idequipe]"
                class="text-center py-8"
              >
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="mx-auto h-8 w-8 text-club-green animate-spin"
                />
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Chargement des rencontres...
                </p>
              </div>

              <!-- Erreur des matchs -->
              <div
                v-else-if="matchesErrors[team.idequipe]"
                class="text-center py-8"
              >
                <p class="text-sm text-red-600 dark:text-red-400">
                  Erreur: {{ matchesErrors[team.idequipe] }}
                </p>
              </div>

              <!-- Liste des matchs -->
              <div
                v-else-if="teamMatches[team.idequipe]?.length > 0"
                class="space-y-3"
              >
                <h4 class="font-medium text-gray-900 dark:text-white mb-3">
                  Calendrier des rencontres ({{
                    teamMatches[team.idequipe].length
                  }})
                </h4>
                <div
                  v-for="(match, index) in teamMatches[team.idequipe]"
                  :key="index"
                  class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <div class="text-2xl">
                      {{ match.equa.includes("LIBERCOURT") ? "🏠" : "🚌" }}
                    </div>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ match.equa }} vs {{ match.equb }}
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400">
                        {{ formatDate(match.dateprevue || match.datereelle) }}
                        <span v-if="match.heuredebut" class="ml-2">
                          à {{ match.heuredebut }}
                        </span>
                      </div>
                      <!-- Actions pour tous les matchs -->
                      <div class="mt-1 flex items-center space-x-2">
                        <!-- Bouton calendrier pour tous les matchs -->
                        <UButton
                          @click="addMatchToCalendar(match, team)"
                          variant="ghost"
                          color="green"
                          size="xs"
                          :title="`Ajouter le match au calendrier`"
                        >
                          📅 Agenda
                        </UButton>

                        <!-- Actions spécifiques aux matchs à l'extérieur -->
                        <template v-if="!match.equa.includes('LIBERCOURT')">
                          <UButton
                            @click="openGoogleMaps(match, team)"
                            variant="ghost"
                            color="blue"
                            size="xs"
                            icon="i-heroicons-map-pin"
                          >
                            📍 Itinéraire
                          </UButton>
                          <span
                            v-if="getTravelTime(match, team)"
                            class="text-xs text-gray-500 dark:text-gray-400"
                          >
                            (~{{ getTravelTime(match, team) }}min)
                          </span>
                        </template>
                      </div>
                      <!-- Lien Google Maps pour les matchs à l'extérieur (ancien code) -->
                      <div
                        v-if="false"
                        class="mt-1 flex items-center space-x-2"
                      >
                        <UButton
                          @click="
                            openGoogleMaps(
                              match.equa.includes('LIBERCOURT')
                                ? match.equb
                                : match.equa,
                            )
                          "
                          variant="ghost"
                          color="blue"
                          size="xs"
                          icon="i-heroicons-map-pin"
                        >
                          📍 Itinéraire
                        </UButton>
                        <UButton
                          @click="addMatchToCalendar(match, team)"
                          variant="ghost"
                          color="green"
                          size="xs"
                          :title="`Ajouter le match au calendrier`"
                        >
                          📅 Agenda
                        </UButton>
                        <span
                          v-if="getTravelTime(match, team)"
                          class="text-xs text-gray-500 dark:text-gray-400"
                        >
                          (~{{ getTravelTime(match, team) }}min)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-if="match.scorea && match.scoreb" class="text-right">
                    <div class="font-semibold text-gray-900 dark:text-white">
                      {{ match.scorea }} - {{ match.scoreb }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      {{ match.resa }} - {{ match.resb }}
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-500">
                    À venir
                  </div>
                </div>
              </div>

              <!-- Aucun match trouvé -->
              <div
                v-else
                class="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-calendar-x"
                  class="mx-auto h-8 w-8 mb-2"
                />
                <p class="text-sm">
                  Aucune rencontre trouvée pour cette équipe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Aucune équipe trouvée -->
      <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
        <UIcon
          name="i-heroicons-user-group-slash"
          class="mx-auto h-12 w-12 mb-4"
        />
        <p class="text-lg">Aucune équipe trouvée</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import clubConfig from "~/content/club/config.json";

interface TeamData {
  idequipe: string;
  libequipe: string;
  libdivision: string;
  liendivision: string;
  idepr: string;
  libepr: string;
}

interface MatchData {
  equa: string;
  equb: string;
  scorea: string;
  scoreb: string;
  resa: string;
  resb: string;
  dateprevue: string;
  datereelle: string;
  heuredebut: string;
  lien: string;
  nomjour: string;
  equipId1: string;
  equipId2: string;
}

// State management
const selectedCategory = ref<"all" | "seniors" | "juniors">("all");
const expandedTeams = ref<string[]>([]);
const teamMatches = ref<Record<string, MatchData[]>>({});
const loadingMatches = ref<Record<string, boolean>>({});
const matchesErrors = ref<Record<string, string>>({});
const clubDetailsCache = ref<Record<string, any>>({});

// Fetch teams data
const {
  data: teams,
  pending: teamsLoading,
  error: teamsError,
} = await useFetch<{
  success: boolean;
  data?: TeamData[];
  error?: string;
}>("/api/teams");

// Computed properties - Utiliser les mêmes noms que la page licenciés pour cohérence
const seniorTeams = computed(() => {
  if (!teams.value?.success || !teams.value.data) return [];
  return teams.value.data.filter(
    (team) => team.libepr === "FED_Championnat de France par Equipes Masculin",
  );
});

const juniorTeams = computed(() => {
  if (!teams.value?.success || !teams.value.data) return [];
  return teams.value.data.filter(
    (team) => team.libepr === "FED_Championnat par Equipes Jeunes",
  );
});

const filteredTeams = computed(() => {
  if (!teams.value?.success || !teams.value.data) return [];

  switch (selectedCategory.value) {
    case "seniors":
      return seniorTeams.value;
    case "juniors":
      return juniorTeams.value;
    default:
      return teams.value.data;
  }
});

// Estimation du nombre total de matches (7 matches par équipe en moyenne)
const totalMatches = computed(() => {
  if (!teams.value?.success || !teams.value.data) return 0;
  // Chaque équipe a environ 7 rencontres par phase
  return teams.value.data.length * 7;
});

// Helper functions - Cohérent avec la page licenciés
function getTeamType(team: TeamData): string {
  return team.libepr === "FED_Championnat par Equipes Jeunes"
    ? "Juniors"
    : "Adultes";
}

function getTeamTypeClass(team: TeamData): string {
  return team.libepr === "FED_Championnat par Equipes Jeunes"
    ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
    : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200";
}

function formatDate(dateString: string): string {
  if (!dateString) return "Date non définie";

  // Parse French date format DD/MM/YYYY
  const parts = dateString.split("/");
  if (parts.length === 3) {
    const date = new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0]),
    );
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return dateString;
}

async function getClubDetailsFromTeam(teamData: TeamData) {
  if (clubDetailsCache.value[teamData.idequipe]) {
    return clubDetailsCache.value[teamData.idequipe];
  }

  try {
    const response = await $fetch("/api/team-club", {
      method: "POST",
      body: { team: teamData },
    });

    if (response.success && "data" in response && response.data) {
      clubDetailsCache.value[teamData.idequipe] = response.data;
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching club details from team:", error);
  }

  return null;
}

async function openGoogleMaps(match: MatchData, currentTeam: TeamData) {
  // Determine which team is the opponent
  const isCurrentTeamA = match.equipId1 === currentTeam.idequipe;
  const opponentTeamId = isCurrentTeamA ? match.equipId2 : match.equipId1;
  const opponentTeamName = isCurrentTeamA ? match.equb : match.equa;

  // Create opponent team data from match info
  // We need to construct the team data since opponent teams are not in our teams list
  const opponentTeam: TeamData = {
    idequipe: opponentTeamId,
    libequipe: opponentTeamName,
    libdivision: currentTeam.libdivision, // Same division as current team
    liendivision: currentTeam.liendivision, // Same division link
    idepr: currentTeam.idepr,
    libepr: currentTeam.libepr,
  };

  const clubDetails = await getClubDetailsFromTeam(opponentTeam);

  if (clubDetails?.googleMapsUrl) {
    window.open(clubDetails.googleMapsUrl, "_blank");
    return;
  }

  // Fallback to old method
  const cleanName = opponentTeamName.replace(/\s+\d+$/, "").trim();
  const query = encodeURIComponent(
    `${cleanName} tennis de table, Pas-de-Calais, France`,
  );
  const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(fallbackUrl, "_blank");
}

function getTravelTime(match: MatchData, currentTeam: TeamData): string | null {
  // Determine which team is the opponent
  const isCurrentTeamA = match.equipId1 === currentTeam.idequipe;
  const opponentTeamId = isCurrentTeamA ? match.equipId2 : match.equipId1;

  const clubDetails = clubDetailsCache.value[opponentTeamId];
  if (clubDetails?.travelTimeMinutes) {
    return `${clubDetails.travelTimeMinutes}`;
  }

  // Si pas de données, déclencher le chargement en arrière-plan
  if (!clubDetails) {
    const opponentTeamName = isCurrentTeamA ? match.equb : match.equa;
    const opponentTeam: TeamData = {
      idequipe: opponentTeamId,
      libequipe: opponentTeamName,
      libdivision: currentTeam.libdivision,
      liendivision: currentTeam.liendivision,
      idepr: currentTeam.idepr,
      libepr: currentTeam.libepr,
    };
    getClubDetailsFromTeam(opponentTeam); // Preload sans await
  }

  return null;
}

async function loadTeamMatches(team: TeamData) {
  if (teamMatches.value[team.idequipe]) {
    return; // Already loaded
  }

  loadingMatches.value[team.idequipe] = true;
  matchesErrors.value[team.idequipe] = "";

  try {
    const response = await $fetch<{
      success: boolean;
      data?: MatchData[];
      error?: string;
    }>("/api/team-matches", {
      method: "POST",
      body: { team },
    });

    if (response.success && response.data) {
      teamMatches.value[team.idequipe] = response.data;
      // Preload club details for away matches
      const awayMatches = response.data.filter(
        (match) => !match.equa.includes("LIBERCOURT"),
      );
      for (const match of awayMatches) {
        const isCurrentTeamA = match.equipId1 === team.idequipe;
        const opponentTeamId = isCurrentTeamA ? match.equipId2 : match.equipId1;

        const opponentTeamName = isCurrentTeamA ? match.equb : match.equa;
        const opponentTeam: TeamData = {
          idequipe: opponentTeamId,
          libequipe: opponentTeamName,
          libdivision: team.libdivision,
          liendivision: team.liendivision,
          idepr: team.idepr,
          libepr: team.libepr,
        };
        getClubDetailsFromTeam(opponentTeam); // Preload in background
      }
    } else {
      matchesErrors.value[team.idequipe] = response.error || "Erreur inconnue";
    }
  } catch (error) {
    matchesErrors.value[team.idequipe] = "Erreur de connexion";
  } finally {
    loadingMatches.value[team.idequipe] = false;
  }
}

function toggleTeamExpansion(teamId: string) {
  const index = expandedTeams.value.indexOf(teamId);

  if (index === -1) {
    expandedTeams.value.push(teamId);
    // Load matches when expanding
    const team = teams.value?.data?.find((t) => t.idequipe === teamId);
    if (team) {
      loadTeamMatches(team);
    }
  } else {
    expandedTeams.value.splice(index, 1);
  }
}

async function addMatchToCalendar(match: MatchData, team: TeamData) {
  try {
    // Determine if this is a home or away match
    const isHome = match.equa.includes("LIBERCOURT");
    const opponent = isHome ? match.equb : match.equa;

    // Get club location for the match
    let matchLocation = "";
    if (isHome) {
      // Use our club's location
      matchLocation = clubConfig.location.name;
    } else {
      // Get opponent club details for away match
      const isCurrentTeamA = match.equipId1 === team.idequipe;
      const opponentTeamId = isCurrentTeamA ? match.equipId2 : match.equipId1;
      const opponentTeam: TeamData = {
        idequipe: opponentTeamId,
        libequipe: opponent,
        libdivision: team.libdivision,
        liendivision: team.liendivision,
        idepr: team.idepr,
        libepr: team.libepr,
      };

      const clubDetails = await getClubDetailsFromTeam(opponentTeam);
      if (clubDetails?.adresse && clubDetails?.ville) {
        matchLocation = `${clubDetails.adresse}, ${clubDetails.ville}`;
      }
    }

    // Create match date from dateprevue (DD/MM/YYYY format)
    const dateParts = match.dateprevue.split("/");
    let matchDate: Date;

    if (dateParts.length === 3) {
      matchDate = new Date(
        parseInt(dateParts[2]), // year
        parseInt(dateParts[1]) - 1, // month (0-indexed)
        parseInt(dateParts[0]), // day
      );
    } else {
      matchDate = new Date();
    }

    // Set match time from heuredebut (HH:MM format)
    if (match.heuredebut) {
      const timeParts = match.heuredebut.split(":");
      if (timeParts.length === 2) {
        matchDate.setHours(
          parseInt(timeParts[0]),
          parseInt(timeParts[1]),
          0,
          0,
        );
      }
    } else {
      // Default time based on team category
      if (team.libepr === "FED_Championnat par Equipes Jeunes") {
        // Juniors: 13h - 17h
        matchDate.setHours(13, 0, 0, 0);
      } else {
        // Adultes: 8h - 13h
        matchDate.setHours(8, 0, 0, 0);
      }
    }

    // Create end time (5 hours after start for matches)
    const endTime = new Date(matchDate.getTime() + 4 * 60 * 60 * 1000);

    // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
    const formatGoogleDate = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    };

    // Build match title - use original format from SmartPing data
    const matchTitle = `${match.equa} vs ${match.equb}`;

    // Build description
    let description = `Match de championnat - ${team.libdivision}\n`;
    description += `Équipe: ${team.libequipe}\n`;
    description += `Adversaire: ${opponent}\n`;
    description += `${isHome ? "<b>Match à domicile</b>" : "<b>Match à l'extérieur</b>"}`;

    // Build Google Calendar URL parameters
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: matchTitle,
      dates: `${formatGoogleDate(matchDate)}/${formatGoogleDate(endTime)}`,
      details: description.trim(),
      location: matchLocation,
      sprop: "name:Club Pongiste Libercourtois",
    });

    // Create the Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;

    // Try to open Google Calendar in a new window
    const popup = window.open(
      googleCalendarUrl,
      "_blank",
      "noopener,noreferrer",
    );

    // Fallback: copy URL to clipboard if popup blocked
    if (!popup || popup.closed) {
      navigator.clipboard
        ?.writeText(googleCalendarUrl)
        .then(() => {
          alert(
            "Le lien du calendrier a été copié dans le presse-papiers. Collez-le dans votre navigateur pour ajouter le match à votre agenda.",
          );
        })
        .catch(() => {
          // Final fallback: show the URL
          prompt(
            "Copiez ce lien pour ajouter le match à votre calendrier Google:",
            googleCalendarUrl,
          );
        });
    }
  } catch (error) {
    console.error("Error creating calendar event for match:", error);
    alert(
      "Une erreur est survenue lors de la création de l'événement calendrier. Veuillez réessayer.",
    );
  }
}

// SEO
useHead({
  title: "Équipes & Rencontres - Club Pongiste Libercourtois",
  meta: [
    {
      name: "description",
      content:
        "Calendrier des matchs et résultats de toutes les équipes du Club Pongiste Libercourtois. Suivez nos équipes seniors et juniors en championnat.",
    },
  ],
});
</script>
