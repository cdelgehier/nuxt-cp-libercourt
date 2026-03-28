<script setup lang="ts">
import type {
  SeriesWithBracket,
  BracketMatchWithPlayers,
  SeriesRegistration,
  TournamentWithSeries,
} from "~~/server/domains/tournament/types";

definePageMeta({ middleware: "ja", layout: "ja" });

const route = useRoute();
const slug = route.params.slug as string;
const toast = useToast();

const { data: me } = await useFetch<{
  jaAccessId: number | null;
  jaName: string;
  tournamentId: number | null;
  isAdmin: boolean;
}>("/api/ja/me", { server: false });

const { data: tournament, refresh: refreshTournament } =
  await useFetch<TournamentWithSeries>(`/api/ja/tournois/${slug}`);

useSeoMeta({ title: "Interface Juge Arbitre" });

const seriesList = computed(() => tournament.value?.series ?? []);
const selectedSeriesId = ref<number | null>(null);
const series = ref<SeriesWithBracket | null>(null);
const loadingSeries = ref(false);

const currentSeries = computed(
  () => seriesList.value.find((s) => s.id === selectedSeriesId.value) ?? null,
);

async function loadSeries(id: number) {
  loadingSeries.value = true;
  try {
    series.value = await $fetch<SeriesWithBracket>(
      `/api/tournois/${slug}/series/${id}`,
    );
  } finally {
    loadingSeries.value = false;
  }
}

watch(selectedSeriesId, (id) => {
  if (id) {
    loadSeries(id);
    loadRegistrations(id);
    jaTab.value = "registrations";
  }
});
watch(
  seriesList,
  (list) => {
    const first = list[0];
    if (first && !selectedSeriesId.value) selectedSeriesId.value = first.id;
  },
  { immediate: true },
);

// Polling bracket every 30s when in_progress
const { pause, resume } = useIntervalFn(() => {
  if (selectedSeriesId.value && currentSeries.value?.status === "in_progress") {
    loadSeries(selectedSeriesId.value);
  }
}, 30000);
watch(
  () => currentSeries.value?.status,
  (s) => (s === "in_progress" ? resume() : pause()),
  { immediate: true },
);
onUnmounted(() => pause());

// Tabs
const jaTab = ref<"registrations" | "bracket" | "scores">("registrations");
const showBracketTab = computed(() =>
  ["bracket_generated", "in_progress", "finished"].includes(
    currentSeries.value?.status ?? "",
  ),
);
const showScoresTab = computed(() =>
  ["in_progress", "finished"].includes(currentSeries.value?.status ?? ""),
);

// Registrations
const registrations = ref<SeriesRegistration[]>([]);
const loadingReg = ref(false);
const addRegOpen = ref(false);

async function loadRegistrations(id: number) {
  loadingReg.value = true;
  try {
    registrations.value = await $fetch<SeriesRegistration[]>(
      `/api/ja/tournois/${slug}/series/${id}/registrations`,
    );
  } finally {
    loadingReg.value = false;
  }
}

async function refreshRegistrations() {
  if (selectedSeriesId.value) await loadRegistrations(selectedSeriesId.value);
}

// Registration stats
const presentCount = computed(
  () =>
    registrations.value.filter((r) => r.attendanceStatus === "present").length,
);
const absentCount = computed(
  () =>
    registrations.value.filter((r) => r.attendanceStatus === "absent").length,
);
const unknownCount = computed(
  () =>
    registrations.value.filter((r) => r.attendanceStatus === "unknown").length,
);

// Bracket actions
const generatingBracket = ref(false);
const startingBracket = ref(false);
const droppingBracket = ref(false);

async function generateBracket() {
  if (!selectedSeriesId.value) return;
  if (
    !confirm(
      'Générer le tableau ?\n\nLes inscriptions seront fermées — utilisez "Annuler le tableau" pour les rouvrir si nécessaire.',
    )
  )
    return;
  generatingBracket.value = true;
  try {
    await $fetch(
      `/api/ja/tournois/${slug}/series/${selectedSeriesId.value}/bracket/generate`,
      { method: "POST" },
    );
    await refreshTournament();
    await loadSeries(selectedSeriesId.value);
    jaTab.value = "bracket";
    toast.add({ title: "Tableau généré", color: "success" });
  } catch (e: any) {
    toast.add({
      title: e?.data?.message ?? "Erreur lors de la génération",
      color: "error",
    });
  } finally {
    generatingBracket.value = false;
  }
}

async function regenerateBracket() {
  if (!selectedSeriesId.value) return;
  if (
    !confirm(
      "Régénérer le tableau ?\n\nL'ordre actuel des joueurs sera recalculé.",
    )
  )
    return;
  generatingBracket.value = true;
  try {
    await $fetch(
      `/api/ja/tournois/${slug}/series/${selectedSeriesId.value}/bracket/regenerate`,
      { method: "POST" },
    );
    await refreshTournament();
    await loadSeries(selectedSeriesId.value);
    jaTab.value = "bracket";
    toast.add({ title: "Tableau régénéré", color: "success" });
  } catch (e: any) {
    toast.add({
      title: e?.data?.message ?? "Erreur lors de la régénération",
      color: "error",
    });
  } finally {
    generatingBracket.value = false;
  }
}

async function startSeries() {
  if (!selectedSeriesId.value) return;
  if (
    !confirm(
      "Démarrer la série ?\n\nLe tableau sera figé — il ne sera plus possible d'échanger des joueurs.",
    )
  )
    return;
  startingBracket.value = true;
  try {
    await $fetch(
      `/api/ja/tournois/${slug}/series/${selectedSeriesId.value}/start`,
      { method: "POST" },
    );
    await refreshTournament();
    await loadSeries(selectedSeriesId.value);
    jaTab.value = "scores";
    toast.add({ title: "Série démarrée !", color: "success" });
  } catch (e: any) {
    toast.add({
      title: e?.data?.message ?? "Erreur au démarrage",
      color: "error",
    });
  } finally {
    startingBracket.value = false;
  }
}

async function dropBracket() {
  if (!selectedSeriesId.value) return;
  droppingBracket.value = true;
  try {
    await $fetch(
      `/api/ja/tournois/${slug}/series/${selectedSeriesId.value}/bracket/drop`,
      { method: "DELETE" },
    );
    await refreshTournament();
    series.value = null;
    jaTab.value = "registrations";
    toast.add({
      title: "Tableau supprimé — inscriptions rouvertes",
      color: "success",
    });
  } catch (e: any) {
    toast.add({
      title: e?.data?.message ?? "Erreur lors de la suppression",
      color: "error",
    });
  } finally {
    droppingBracket.value = false;
  }
}

// Score modal
const scoreModalOpen = ref(false);
const activeMatch = ref<BracketMatchWithPlayers | null>(null);

function playerName(p: BracketMatchWithPlayers["player1"]): string {
  if (!p) return "—";
  if (p.partnerLastName) return `${p.lastName} / ${p.partnerLastName}`;
  return `${p.firstName} ${p.lastName}`;
}

function openScore(match: BracketMatchWithPlayers) {
  activeMatch.value = match;
  scoreModalOpen.value = true;
}

async function afterScore() {
  if (selectedSeriesId.value) await loadSeries(selectedSeriesId.value);
}

const pendingMatches = computed<BracketMatchWithPlayers[]>(() => {
  if (!series.value) return [];
  return series.value.rounds
    .flatMap((r) => r.matches)
    .filter((m) => m.status === "pending" && m.player1 && m.player2);
});

// Finished matches that can potentially be corrected (next match not yet finished)
const correctableMatches = computed<BracketMatchWithPlayers[]>(() => {
  if (!series.value) return [];
  const allMatches = series.value.rounds.flatMap((r) => r.matches);
  const finishedById = new Map(
    allMatches
      .filter((m) => m.status === "finished" || m.status === "forfeit")
      .map((m) => [m.id, m]),
  );
  return [...finishedById.values()].filter((m) => {
    if (!m.nextMatchId) return true; // final — always correctable
    const next = allMatches.find((n) => n.id === m.nextMatchId);
    return !next || (next.status !== "finished" && next.status !== "forfeit");
  });
});

async function logout() {
  if (me.value?.isAdmin) {
    await navigateTo(`/admin/tournois/${slug}`);
  } else {
    await $fetch("/api/ja/auth", { method: "DELETE" });
    await navigateTo(`/tournois/${slug}/ja/login`);
  }
}

// Status label
const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  registration: "Inscriptions",
  bracket_generated: "Tableau prêt",
  in_progress: "En cours",
  finished: "Terminée",
};
const statusColor: Record<string, string> = {
  draft: "text-gray-400",
  registration: "text-blue-600",
  bracket_generated: "text-amber-600",
  in_progress: "text-green-600",
  finished: "text-gray-500",
};
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900">
          {{ tournament?.name ?? "Interface Juge Arbitre" }}
        </h1>
        <p class="text-sm text-gray-500 mt-0.5">
          JA : <strong>{{ me?.jaName }}</strong>
        </p>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        :icon="
          me?.isAdmin
            ? 'i-heroicons-arrow-left'
            : 'i-heroicons-arrow-right-on-rectangle'
        "
        @click="logout"
      >
        {{ me?.isAdmin ? "Retour admin" : "Déconnexion" }}
      </UButton>
    </div>

    <div v-if="seriesList.length === 0" class="text-center text-gray-400 py-20">
      Aucune série pour ce tournoi.
    </div>

    <template v-else>
      <!-- Series selector -->
      <TournamentSeriesSelector
        :series="seriesList"
        :model-value="selectedSeriesId"
        class="mb-5"
        @update:model-value="selectedSeriesId = $event"
      />

      <!-- Stats bar (inscriptions tab) -->
      <div v-if="currentSeries" class="flex flex-wrap gap-4 mb-4 text-sm">
        <span class="text-gray-500">
          <strong class="text-gray-900">{{ registrations.length }}</strong>
          inscrits
        </span>
        <span class="text-green-600 font-medium"
          >{{ presentCount }} présents</span
        >
        <span class="text-red-500 font-medium">{{ absentCount }} absents</span>
        <span v-if="unknownCount" class="text-gray-400"
          >{{ unknownCount }} non confirmés</span
        >
        <span
          class="ml-auto text-xs font-semibold uppercase tracking-wide"
          :class="statusColor[currentSeries.status]"
        >
          {{ statusLabel[currentSeries.status] }}
        </span>
      </div>

      <!-- Action bar by status -->
      <div v-if="currentSeries" class="flex flex-wrap gap-2 mb-5">
        <!-- Inscriptions open: can generate bracket -->
        <template
          v-if="
            currentSeries.status === 'draft' ||
            currentSeries.status === 'registration'
          "
        >
          <UButton
            size="sm"
            icon="i-heroicons-user-plus"
            @click="addRegOpen = true"
          >
            Inscrire un joueur
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-heroicons-table-cells"
            :loading="generatingBracket"
            :disabled="presentCount < 2"
            @click="generateBracket"
          >
            Générer le tableau
            <span v-if="presentCount < 2" class="text-xs opacity-60"
              >(min. 2 présents)</span
            >
          </UButton>
        </template>

        <!-- Bracket generated: can swap + start -->
        <template v-else-if="currentSeries.status === 'bracket_generated'">
          <UButton
            size="sm"
            icon="i-heroicons-user-plus"
            variant="outline"
            color="neutral"
            @click="addRegOpen = true"
          >
            Inscrire
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-path"
            :loading="generatingBracket"
            @click="regenerateBracket"
          >
            Regénérer
          </UButton>
          <UButton
            size="sm"
            color="red"
            variant="outline"
            icon="i-heroicons-trash"
            :loading="droppingBracket"
            @click="dropBracket"
          >
            Annuler le tableau
          </UButton>
          <UButton
            size="sm"
            icon="i-heroicons-play"
            :loading="startingBracket"
            @click="startSeries"
          >
            Démarrer la série
          </UButton>
        </template>

        <!-- In progress: just the inscrire button -->
        <template v-else-if="currentSeries.status === 'in_progress'">
          <UButton
            size="sm"
            icon="i-heroicons-user-plus"
            variant="outline"
            color="neutral"
            @click="addRegOpen = true"
          >
            Inscrire
          </UButton>
        </template>
      </div>

      <!-- Sub-tabs -->
      <div class="flex gap-1 mb-5 border-b border-gray-200">
        <button
          class="px-5 py-3 text-base font-medium border-b-2 transition-colors"
          :class="
            jaTab === 'registrations'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
          @click="jaTab = 'registrations'"
        >
          Inscriptions
        </button>
        <button
          v-if="showBracketTab"
          class="px-5 py-3 text-base font-medium border-b-2 transition-colors"
          :class="
            jaTab === 'bracket'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
          @click="
            jaTab = 'bracket';
            loadSeries(selectedSeriesId!);
          "
        >
          Tableau
        </button>
        <button
          v-if="showScoresTab"
          class="px-5 py-3 text-base font-medium border-b-2 transition-colors"
          :class="
            jaTab === 'scores'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
          @click="jaTab = 'scores'"
        >
          Matchs
          <span
            v-if="pendingMatches.length"
            class="ml-1 inline-flex items-center justify-center w-5 h-5 text-sm bg-red-500 text-white rounded-full"
          >
            {{ pendingMatches.length }}
          </span>
        </button>
      </div>

      <!-- Tab: Inscriptions -->
      <div v-if="jaTab === 'registrations'">
        <TournamentRegistrationTable
          :registrations="registrations"
          :series-format="
            (currentSeries?.seriesFormat as 'singles' | 'doubles') ?? 'singles'
          "
          :slug="slug"
          :series-id="selectedSeriesId!"
          :loading="loadingReg"
          api-base="/api/ja/tournois"
          @refresh="refreshRegistrations"
        />
      </div>

      <!-- Tab: Tableau -->
      <div v-else-if="jaTab === 'bracket'">
        <div v-if="loadingSeries" class="text-center text-gray-400 py-8">
          Chargement...
        </div>
        <template v-else-if="series">
          <p
            v-if="currentSeries?.status === 'bracket_generated'"
            class="text-sm text-amber-600 mb-4 flex items-center gap-2"
          >
            <UIcon
              name="i-heroicons-information-circle"
              class="w-4 h-4 shrink-0"
            />
            Cliquez sur un joueur pour le sélectionner, puis sur un autre pour
            les échanger de position.
          </p>
          <TournamentBracketEditor
            v-if="currentSeries?.status === 'bracket_generated'"
            :rounds="series.rounds"
            :series-id="selectedSeriesId!"
            :slug="slug"
            swap-api-base="/api/ja"
            @refresh="loadSeries(selectedSeriesId!)"
          />
          <TournamentBracketView v-else :rounds="series.rounds" />
        </template>
      </div>

      <!-- Tab: Matchs en attente -->
      <div v-else-if="jaTab === 'scores'">
        <div
          v-if="pendingMatches.length === 0"
          class="text-gray-400 text-sm py-8 text-center"
        >
          Aucun match en attente.
        </div>
        <div v-else class="space-y-2 max-w-2xl">
          <div
            v-for="match in pendingMatches"
            :key="match.id"
            class="flex items-center justify-between px-4 py-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm"
          >
            <div class="text-base">
              <span class="font-semibold">{{ playerName(match.player1) }}</span>
              <span class="text-gray-400 mx-2">vs</span>
              <span class="font-semibold">{{ playerName(match.player2) }}</span>
              <span
                v-if="match.tableNumber"
                class="ml-3 text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded"
              >
                Table {{ match.tableNumber }}
              </span>
            </div>
            <UButton @click="openScore(match)">Saisir</UButton>
          </div>
        </div>

        <!-- Correctable finished matches -->
        <div v-if="correctableMatches.length > 0" class="mt-8 max-w-2xl">
          <h2
            class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3"
          >
            Matchs terminés — correction possible
          </h2>
          <div class="space-y-2">
            <div
              v-for="match in correctableMatches"
              :key="match.id"
              class="flex items-center justify-between px-4 py-4 bg-white border border-amber-200 rounded-lg hover:shadow-sm"
            >
              <div class="text-base">
                <span
                  :class="
                    match.winnerId === match.player1?.id
                      ? 'font-bold'
                      : 'opacity-50'
                  "
                >
                  {{ playerName(match.player1) }}
                </span>
                <span class="text-gray-400 mx-2">vs</span>
                <span
                  :class="
                    match.winnerId === match.player2?.id
                      ? 'font-bold'
                      : 'opacity-50'
                  "
                >
                  {{ playerName(match.player2) }}
                </span>
                <span
                  v-if="match.status === 'forfeit'"
                  class="ml-2 text-xs text-red-500 font-medium"
                  >FF</span
                >
              </div>
              <UButton
                variant="outline"
                color="warning"
                icon="i-heroicons-pencil-square"
                @click="openScore(match)"
              >
                Corriger
              </UButton>
            </div>
          </div>
        </div>

        <div v-if="series" class="mt-8">
          <h2
            class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3"
          >
            Tableau complet
          </h2>
          <TournamentBracketView :rounds="series.rounds" />
        </div>
      </div>
    </template>

    <!-- Modals -->
    <TournamentJaMultiSeriesRegistrationModal
      :open="addRegOpen"
      :series="seriesList"
      :slug="slug"
      @update:open="addRegOpen = $event"
      @refresh="refreshRegistrations"
    />

    <TournamentScoreModal
      v-if="activeMatch"
      v-model:open="scoreModalOpen"
      :match="activeMatch"
      :slug="slug"
      :series-id="selectedSeriesId!"
      :sets-to-win="currentSeries?.setsToWin ?? 3"
      @refresh="afterScore"
    />
  </div>
</template>
