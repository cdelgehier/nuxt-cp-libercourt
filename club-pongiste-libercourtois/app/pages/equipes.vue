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
            <div class="text-2xl font-bold text-teal-700">
              {{ currentPhaseTeams.length }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Équipes (Phase {{ currentPhase }})
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
            :color="selectedCategory === 'seniors' ? 'blue' : 'gray'"
            @click="selectedCategory = 'seniors'"
          >
            Adultes ({{ seniorTeams.length }})
          </UButton>
          <UButton
            :variant="selectedCategory === 'juniors' ? 'solid' : 'outline'"
            :color="selectedCategory === 'juniors' ? 'green' : 'gray'"
            @click="selectedCategory = 'juniors'"
          >
            Juniors ({{ juniorTeams.length }})
          </UButton>
        </div>

        <!-- Liste des équipes par phase -->
        <div class="space-y-8">
          <!-- Section par phase -->
          <div
            v-for="phase in sortedPhases"
            :key="phase"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <!-- En-tête de phase (cliquable pour replier/déplier) -->
            <button
              class="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-club-green/10 to-club-yellow/10 dark:from-club-green/20 dark:to-club-yellow/20 hover:from-club-green/20 hover:to-club-yellow/20 transition-all duration-200"
              @click="togglePhase(phase)"
            >
              <div class="flex items-center space-x-4">
                <div
                  class="flex items-center justify-center w-10 h-10 rounded-full bg-club-green text-club-navy font-bold text-lg"
                >
                  {{ phase }}
                </div>
                <div class="text-left">
                  <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ getPhaseLabel(phase) }}
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ getPhaseDescription(phase) }} -
                    {{ getFilteredTeamsForPhase(phase).length }} équipe(s)
                  </p>
                </div>
                <span
                  v-if="phase === sortedPhases[0]"
                  class="ml-2 px-2 py-0.5 text-xs font-semibold bg-club-green text-club-navy rounded-full"
                >
                  En cours
                </span>
              </div>
              <UIcon
                :name="
                  isPhaseCollapsed(phase)
                    ? 'i-heroicons-chevron-down'
                    : 'i-heroicons-chevron-up'
                "
                class="w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-200"
              />
            </button>

            <!-- Contenu de la phase (équipes) -->
            <div
              v-show="!isPhaseCollapsed(phase)"
              class="divide-y divide-gray-200 dark:divide-gray-700"
            >
              <div
                v-for="team in getFilteredTeamsForPhase(phase)"
                :key="team.uniqueKey"
                class="bg-white dark:bg-gray-800"
              >
                <!-- En-tête de l'équipe -->
                <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {{ cleanTeamName(team.libequipe) }}
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
                        expandedTeams.includes(team.uniqueKey)
                          ? 'solid'
                          : 'outline'
                      "
                      size="sm"
                      @click="toggleTeamExpansion(team.uniqueKey)"
                    >
                      <UIcon
                        :name="
                          expandedTeams.includes(team.uniqueKey)
                            ? 'i-heroicons-chevron-up'
                            : 'i-heroicons-chevron-down'
                        "
                        class="w-4 h-4"
                      />
                      {{
                        expandedTeams.includes(team.uniqueKey)
                          ? "Masquer"
                          : "Voir les matchs"
                      }}
                    </UButton>
                  </div>
                </div>

                <!-- Matchs de l'équipe (expandable) -->
                <div v-if="expandedTeams.includes(team.uniqueKey)" class="p-6">
                  <!-- Pool ranking section -->
                  <div class="mb-8">
                    <PoolRankingTable
                      :rankings="poolRankings[team.uniqueKey] || []"
                      :loading="loadingRankings[team.uniqueKey]"
                      :error="rankingErrors[team.uniqueKey]"
                    />
                  </div>

                  <!-- Loading des matchs -->
                  <div
                    v-if="loadingMatches[team.uniqueKey]"
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
                    v-else-if="matchesErrors[team.uniqueKey]"
                    class="text-center py-8"
                  >
                    <p class="text-sm text-red-600 dark:text-red-400">
                      Erreur: {{ matchesErrors[team.uniqueKey] }}
                    </p>
                  </div>

                  <!-- Liste des matchs -->
                  <div
                    v-else-if="(teamMatches[team.uniqueKey]?.length ?? 0) > 0"
                    class="space-y-3"
                  >
                    <h4 class="font-medium text-gray-900 dark:text-white mb-3">
                      Calendrier des rencontres ({{
                        teamMatches[team.uniqueKey]?.length
                      }})
                    </h4>
                    <div
                      v-for="(match, index) in teamMatches[team.uniqueKey]"
                      :key="index"
                      class="space-y-3"
                    >
                      <!-- Match principal -->
                      <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <!-- Info du match -->
                        <div class="flex items-start justify-between mb-2">
                          <div
                            class="flex items-center space-x-3 flex-1 min-w-0"
                          >
                            <div class="text-2xl">
                              {{
                                match.equa.includes("LIBERCOURT") ? "🏠" : "🚌"
                              }}
                            </div>
                            <div class="flex-1 min-w-0">
                              <div
                                class="font-medium text-gray-900 dark:text-white"
                              >
                                {{ match.equa }} vs {{ match.equb }}
                              </div>
                              <div
                                class="text-sm text-gray-600 dark:text-gray-400"
                              >
                                {{
                                  formatDate(
                                    match.dateprevue || match.datereelle,
                                  )
                                }}
                                <span v-if="match.heuredebut" class="ml-2">
                                  à {{ match.heuredebut }}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div class="text-right flex-shrink-0 ml-3">
                            <div
                              v-if="match.scorea && match.scoreb"
                              class="font-bold text-lg text-gray-900 dark:text-white"
                            >
                              {{ match.scorea }} - {{ match.scoreb }}
                            </div>
                            <div
                              v-else
                              class="text-sm text-gray-500 dark:text-gray-500"
                            >
                              À venir
                            </div>
                          </div>
                        </div>

                        <!-- Actions pour tous les matchs -->
                        <div class="flex flex-wrap items-center gap-2">
                          <!-- Bouton calendrier pour tous les matchs -->
                          <UButton
                            variant="ghost"
                            color="green"
                            size="xs"
                            :title="`Ajouter le match au calendrier`"
                            class="flex-shrink-0"
                            @click="addMatchToCalendar(match, team)"
                          >
                            📅 Agenda
                          </UButton>

                          <!-- Actions spécifiques aux matchs à l'extérieur -->
                          <template v-if="!match.equa.includes('LIBERCOURT')">
                            <UButton
                              variant="ghost"
                              color="blue"
                              size="xs"
                              icon="i-heroicons-map-pin"
                              class="flex-shrink-0"
                              @click="openGoogleMaps(match, team)"
                            >
                              📍 Itinéraire
                            </UButton>
                            <span
                              v-if="getTravelTime(match, team)"
                              class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0"
                            >
                              (~{{ getTravelTime(match, team) }}min)
                            </span>
                          </template>

                          <!-- Bouton pour les détails des parties -->
                          <UButton
                            v-if="match.scorea && match.scoreb"
                            variant="ghost"
                            color="gray"
                            size="xs"
                            icon="i-heroicons-eye"
                            :title="`${expandedMatchDetails.includes(`${match.equipId1}-${match.equipId2}-${match.dateprevue}`) ? 'Masquer' : 'Voir'} les détails`"
                            class="flex-shrink-0"
                            @click="toggleMatchDetails(match)"
                          >
                            📊 Détails
                          </UButton>
                        </div>

                        <!-- Détails du match DIRECTEMENT SOUS LES BOUTONS -->
                        <div
                          v-if="
                            match.scorea &&
                            match.scoreb &&
                            expandedMatchDetails.includes(
                              `${match.equipId1}-${match.equipId2}-${match.dateprevue}`,
                            )
                          "
                          class="mt-3 p-3 bg-gray-100 dark:bg-gray-600 rounded-md border border-gray-200 dark:border-gray-500"
                        >
                          <!-- Loading des détails -->
                          <div
                            v-if="
                              loadingMatchDetails[
                                `${match.equipId1}-${match.equipId2}-${match.dateprevue}`
                              ]
                            "
                            class="text-center py-2"
                          >
                            <UIcon
                              name="i-heroicons-arrow-path"
                              class="mx-auto h-4 w-4 text-club-green animate-spin"
                            />
                            <p
                              class="mt-1 text-xs text-gray-600 dark:text-gray-400"
                            >
                              Chargement des détails...
                            </p>
                          </div>

                          <!-- Erreur des détails -->
                          <div
                            v-else-if="
                              matchDetailsErrors[
                                `${match.equipId1}-${match.equipId2}-${match.dateprevue}`
                              ]
                            "
                            class="text-center py-2"
                          >
                            <p class="text-xs text-red-600 dark:text-red-400">
                              Erreur:
                              {{
                                matchDetailsErrors[
                                  `${match.equipId1}-${match.equipId2}-${match.dateprevue}`
                                ]
                              }}
                            </p>
                          </div>

                          <!-- Liste des parties -->
                          <div
                            v-else-if="
                              (matchDetails[
                                `${match.equipId1}-${match.equipId2}-${match.dateprevue}`
                              ]?.parties?.length ?? 0) > 0
                            "
                          >
                            <h5
                              class="font-medium text-gray-900 dark:text-white text-xs mb-2 flex items-center"
                            >
                              <UIcon
                                name="i-heroicons-list-bullet"
                                class="w-3 h-3 mr-1 text-club-green"
                              />
                              Détail des parties ({{
                                matchDetails[
                                  `${match.equipId1}-${match.equipId2}-${match.dateprevue}`
                                ]?.parties?.length
                              }})
                            </h5>
                            <div class="space-y-1">
                              <div
                                v-for="(partie, partieIndex) in matchDetails[
                                  `${match.equipId1}-${match.equipId2}-${match.dateprevue}`
                                ]?.parties"
                                :key="partieIndex"
                                class="p-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                              >
                                <!-- Layout mobile/desktop adaptatif -->
                                <div
                                  class="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4 sm:items-start"
                                >
                                  <!-- Joueurs (côte à côte sur mobile, colonnes sur desktop) -->
                                  <div class="flex justify-between sm:contents">
                                    <!-- Joueur A -->
                                    <div
                                      class="flex flex-col items-start sm:items-end min-w-0 flex-1 sm:flex-none"
                                    >
                                      <div
                                        class="flex items-center space-x-1 sm:justify-end w-full"
                                      >
                                        <span
                                          :class="
                                            isPlayerWinner(
                                              partie.scorea,
                                              partie.scoreb,
                                            )
                                              ? 'text-green-600'
                                              : 'text-red-600'
                                          "
                                          class="text-sm flex-shrink-0"
                                        >
                                          {{
                                            isPlayerWinner(
                                              partie.scorea,
                                              partie.scoreb,
                                            )
                                              ? "🟢"
                                              : "🔴"
                                          }}
                                        </span>
                                        <div
                                          class="font-medium text-gray-900 dark:text-white text-sm text-left sm:text-right min-w-0"
                                        >
                                          <div
                                            v-for="(
                                              joueur, idx
                                            ) in partie.ja.split(' et ')"
                                            :key="idx"
                                            class="leading-tight truncate"
                                          >
                                            {{ joueur.trim() }}
                                          </div>
                                        </div>
                                      </div>
                                      <div
                                        v-if="partie.xca"
                                        class="mt-1 sm:self-end"
                                      >
                                        <span
                                          class="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                                        >
                                          {{
                                            partie.xca
                                              .replace("M ", "")
                                              .replace("pts", "")
                                          }}
                                        </span>
                                      </div>
                                    </div>

                                    <!-- Scores (centrés sur mobile et desktop) -->
                                    <div
                                      class="flex items-center justify-center sm:justify-center"
                                    >
                                      <div
                                        class="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded"
                                      >
                                        {{ partie.detail }}
                                      </div>
                                    </div>

                                    <!-- Joueur B -->
                                    <div
                                      class="flex flex-col items-end sm:items-start min-w-0 flex-1 sm:flex-none"
                                    >
                                      <div
                                        class="flex items-center space-x-1 sm:justify-start w-full"
                                      >
                                        <span
                                          :class="
                                            !isPlayerWinner(
                                              partie.scorea,
                                              partie.scoreb,
                                            )
                                              ? 'text-green-600'
                                              : 'text-red-600'
                                          "
                                          class="text-sm flex-shrink-0 order-2 sm:order-1"
                                        >
                                          {{
                                            !isPlayerWinner(
                                              partie.scorea,
                                              partie.scoreb,
                                            )
                                              ? "🟢"
                                              : "🔴"
                                          }}
                                        </span>
                                        <div
                                          class="font-medium text-gray-900 dark:text-white text-sm text-right sm:text-left min-w-0 order-1 sm:order-2"
                                        >
                                          <div
                                            v-for="(
                                              joueur, idx
                                            ) in partie.jb.split(' et ')"
                                            :key="idx"
                                            class="leading-tight truncate"
                                          >
                                            {{ joueur.trim() }}
                                          </div>
                                        </div>
                                      </div>
                                      <div
                                        v-if="partie.xcb"
                                        class="mt-1 sm:self-start"
                                      >
                                        <span
                                          class="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                                        >
                                          {{
                                            partie.xcb
                                              .replace("M ", "")
                                              .replace("pts", "")
                                          }}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Aucun détail trouvé -->
                          <div
                            v-else
                            class="text-center py-2 text-gray-500 dark:text-gray-400"
                          >
                            <p class="text-xs">
                              Détails non disponibles pour cette rencontre
                            </p>
                          </div>
                        </div>
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
            <!-- Aucune équipe dans cette phase avec le filtre actuel -->
            <div
              v-if="getFilteredTeamsForPhase(phase).length === 0"
              class="p-8 text-center text-gray-500 dark:text-gray-400"
            >
              <UIcon
                name="i-heroicons-user-group"
                class="mx-auto h-8 w-8 mb-2"
              />
              <p class="text-sm">
                Aucune équipe
                {{
                  selectedCategory === "juniors"
                    ? "junior"
                    : selectedCategory === "seniors"
                      ? "adulte"
                      : ""
                }}
                dans cette phase
              </p>
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
import type { TeamDataEnriched } from "~~/types";

const toast = useToast();
const clubConfigData = await $fetch("/api/club/config");

const {
  groupByPhase,
  getPhases,
  getPhaseLabel,
  getPhaseDescription,
  isJuniorTeam,
  isSeniorTeam,
} = useTeams();

// Base team data type for FFTT API responses
interface TeamDataBase {
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

interface MatchDetail {
  equa: string;
  equb: string;
  resa: string;
  resb: string;
  parties: PartieDetail[];
}

interface PartieDetail {
  ja: string; // Joueur A
  jb: string; // Joueur B
  scorea: string; // Score joueur A
  scoreb: string; // Score joueur B
  detail: string; // Détail des manches (ex: "11/3 9/11 11/4 11/4")
  xca?: string; // Classement joueur A
  xcb?: string; // Classement joueur B
}

// State management
const selectedCategory = ref<"all" | "seniors" | "juniors">("all");
const expandedTeams = ref<string[]>([]);
const teamMatches = ref<Record<string, MatchData[]>>({});
const loadingMatches = ref<Record<string, boolean>>({});
const matchesErrors = ref<Record<string, string>>({});
const clubDetailsCache = ref<Record<string, any>>({});

// State management for match details
const expandedMatchDetails = ref<string[]>([]);
const matchDetails = ref<Record<string, MatchDetail | null>>({});
const loadingMatchDetails = ref<Record<string, boolean>>({});
const matchDetailsErrors = ref<Record<string, string>>({});

// State management for pool rankings
const poolRankings = ref<Record<string, any[]>>({});
const loadingRankings = ref<Record<string, boolean>>({});
const rankingErrors = ref<Record<string, string>>({});

// Fetch teams data — useLazyFetch to avoid blocking SSR (SmartPing is slow)
const {
  data: teams,
  pending: teamsLoading,
  error: teamsError,
} = useLazyFetch<{
  success: boolean;
  data?: TeamDataEnriched[];
  error?: string;
}>("/api/teams");

// State for collapsed phases (default: all expanded)
const collapsedPhases = ref<number[]>([]);

// Phases sorted: Phase 2 first if present (current season), then Phase 1
const sortedPhases = computed(() => {
  if (!teams.value?.success || !teams.value.data) return [];
  return getPhases(teams.value.data).sort((a, b) => b - a); // Descending: 2, 1
});

// Current phase (the highest one = most recent)
const currentPhase = computed<number>(() => {
  return sortedPhases.value[0] ?? 1;
});

// Teams grouped by phase
const teamsByPhase = computed<Record<number, TeamDataEnriched[]>>(() => {
  if (!teams.value?.success || !teams.value.data) return {};
  return groupByPhase(teams.value.data);
});

// Teams for current phase only (for accurate stats)
const currentPhaseTeams = computed(() => {
  return teamsByPhase.value[currentPhase.value] || [];
});

// Toggle phase collapse
function togglePhase(phase: number) {
  const index = collapsedPhases.value.indexOf(phase);
  if (index === -1) {
    collapsedPhases.value.push(phase);
  } else {
    collapsedPhases.value.splice(index, 1);
  }
}

// Check if phase is collapsed
function isPhaseCollapsed(phase: number): boolean {
  return collapsedPhases.value.includes(phase);
}

// Get filtered teams for a specific phase
function getFilteredTeamsForPhase(phase: number): TeamDataEnriched[] {
  const phaseTeams = teamsByPhase.value[phase] || [];

  switch (selectedCategory.value) {
    case "seniors":
      return phaseTeams.filter((team) => isSeniorTeam(team));
    case "juniors":
      return phaseTeams.filter((team) => isJuniorTeam(team));
    default:
      return phaseTeams;
  }
}

// Computed properties - Stats based on CURRENT phase only (not cumulative)
const seniorTeams = computed(() => {
  return currentPhaseTeams.value.filter((team) => isSeniorTeam(team));
});

const juniorTeams = computed(() => {
  return currentPhaseTeams.value.filter((team) => isJuniorTeam(team));
});

// Estimation du nombre total de matches (7 matches par équipe en moyenne) - current phase only
const totalMatches = computed(() => {
  // Chaque équipe a environ 7 rencontres par phase
  return currentPhaseTeams.value.length * 7;
});

// Clean team name by removing "- Phase X" suffix (since we're already in a phase section)
function cleanTeamName(libequipe: string): string {
  return libequipe.replace(/\s*-\s*Phase\s*\d+$/i, "").trim();
}

// Helper functions - Cohérent avec la page licenciés
function getTeamType(team: TeamDataBase): string {
  return team.libepr === "FED_Championnat par Equipes Jeunes"
    ? "Juniors"
    : "Adultes";
}

function getTeamTypeClass(team: TeamDataBase): string {
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
      parseInt(parts[2]!),
      parseInt(parts[1]!) - 1,
      parseInt(parts[0]!),
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

async function getClubDetailsFromTeam(teamData: TeamDataBase) {
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
  const opponentTeam: TeamDataBase = {
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
    const opponentTeam: TeamDataBase = {
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

async function loadTeamMatches(team: TeamDataEnriched) {
  if (teamMatches.value[team.uniqueKey]) {
    return; // Already loaded
  }

  loadingMatches.value[team.uniqueKey] = true;
  matchesErrors.value[team.uniqueKey] = "";

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
      teamMatches.value[team.uniqueKey] = response.data;
      // Preload club details for away matches
      const awayMatches = response.data.filter(
        (match) => !match.equa.includes("LIBERCOURT"),
      );
      for (const match of awayMatches) {
        const isCurrentTeamA = match.equipId1 === team.idequipe;
        const opponentTeamId = isCurrentTeamA ? match.equipId2 : match.equipId1;

        const opponentTeamName = isCurrentTeamA ? match.equb : match.equa;
        const opponentTeam: TeamDataBase = {
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
      matchesErrors.value[team.uniqueKey] = response.error || "Erreur inconnue";
    }
  } catch (_error) {
    matchesErrors.value[team.uniqueKey] = "Erreur de connexion";
  } finally {
    loadingMatches.value[team.uniqueKey] = false;
  }
}

async function loadPoolRanking(team: TeamDataEnriched) {
  // Set loading state
  loadingRankings.value[team.uniqueKey] = true;
  rankingErrors.value[team.uniqueKey] = "";

  try {
    const response = await $fetch<{
      success: boolean;
      data?: any[];
      error?: string;
    }>("/api/pool-ranking", {
      method: "POST",
      body: {
        team,
        clubNumber: clubConfigData?.clubId || "07620112",
      },
    });

    if (response.success && response.data) {
      poolRankings.value[team.uniqueKey] = response.data;
    } else {
      rankingErrors.value[team.uniqueKey] =
        response.error || "Erreur lors du chargement du classement";
    }
  } catch (error) {
    console.error("Error loading pool ranking:", error);
    rankingErrors.value[team.uniqueKey] = "Impossible de charger le classement";
  } finally {
    loadingRankings.value[team.uniqueKey] = false;
  }
}

function toggleTeamExpansion(uniqueKey: string) {
  const index = expandedTeams.value.indexOf(uniqueKey);

  if (index === -1) {
    expandedTeams.value.push(uniqueKey);
    // Load matches and ranking when expanding
    const team = teams.value?.data?.find((t) => t.uniqueKey === uniqueKey);
    if (team) {
      loadTeamMatches(team);
      loadPoolRanking(team);
    }
  } else {
    expandedTeams.value.splice(index, 1);
  }
}

async function addMatchToCalendar(match: MatchData, team: TeamDataEnriched) {
  try {
    // Determine if this is a home or away match
    const isHome = match.equa.includes("LIBERCOURT");
    const opponent = isHome ? match.equb : match.equa;

    // Get club location for the match
    let matchLocation = "";
    if (isHome) {
      // Use our club's location
      matchLocation = clubConfigData?.salle || "Salle Deladerriere";
    } else {
      // Get opponent club details for away match
      const isCurrentTeamA = match.equipId1 === team.idequipe;
      const opponentTeamId = isCurrentTeamA ? match.equipId2 : match.equipId1;
      const opponentTeam: TeamDataBase = {
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
        parseInt(dateParts[2]!), // year
        parseInt(dateParts[1]!) - 1, // month (0-indexed)
        parseInt(dateParts[0]!), // day
      );
    } else {
      matchDate = new Date();
    }

    // Set match time from heuredebut (HH:MM format)
    if (match.heuredebut) {
      const timeParts = match.heuredebut.split(":");
      if (timeParts.length === 2) {
        matchDate.setHours(
          parseInt(timeParts[0]!),
          parseInt(timeParts[1]!),
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
          toast.add({
            title: "Lien copié",
            description:
              "Collez-le dans votre navigateur pour ajouter le match à votre agenda.",
            color: "green" as const,
          });
        })
        .catch(() => {
          toast.add({
            title: "Impossible de copier",
            description: googleCalendarUrl,
            color: "orange" as const,
          });
        });
    }
  } catch (_error) {
    console.error("Error creating calendar event for match:", _error);
    toast.add({
      title: "Erreur",
      description:
        "Une erreur est survenue lors de la création de l'événement calendrier.",
      color: "red" as const,
    });
  }
}

async function loadMatchDetails(match: MatchData) {
  const matchId = `${match.equipId1}-${match.equipId2}-${match.dateprevue}`;

  if (matchDetails.value[matchId]) {
    return; // Already loaded
  }

  loadingMatchDetails.value[matchId] = true;
  matchDetailsErrors.value[matchId] = "";

  try {
    const response = await $fetch<{
      success: boolean;
      data?: MatchDetail | null;
      error?: string;
    }>("/api/match-details", {
      method: "POST",
      body: { lien: match.lien },
    });

    if (response.success && response.data) {
      matchDetails.value[matchId] = response.data;
    } else {
      matchDetailsErrors.value[matchId] = response.error || "Erreur inconnue";
    }
  } catch (_error) {
    matchDetailsErrors.value[matchId] = "Erreur de connexion";
  } finally {
    loadingMatchDetails.value[matchId] = false;
  }
}

function toggleMatchDetails(match: MatchData) {
  const matchId = `${match.equipId1}-${match.equipId2}-${match.dateprevue}`;
  const index = expandedMatchDetails.value.indexOf(matchId);

  if (index === -1) {
    expandedMatchDetails.value.push(matchId);
    // Load match details when expanding
    loadMatchDetails(match);
  } else {
    expandedMatchDetails.value.splice(index, 1);
  }
}

function isPlayerWinner(scorea: string, scoreb: string): boolean {
  const scoreA = parseInt(scorea) || 0;
  const scoreB = parseInt(scoreb) || 0;
  return scoreA > scoreB;
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
