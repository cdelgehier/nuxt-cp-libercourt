<script setup lang="ts">
import {
  updateTournamentInputSchema,
  type TournamentWithSeries,
  type TournamentJaAccess,
  type TournamentSeries,
  type SeriesRegistration,
  type SeriesWithBracket,
} from "~~/server/domains/tournament/types";

definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const slug = route.params.slug as string;
const toast = useToast();

const { data: tournament, refresh: refreshTournament } =
  await useFetch<TournamentWithSeries>(`/api/admin/tournois/${slug}`);

useSeoMeta({
  title: computed(() =>
    tournament.value ? `Admin — ${tournament.value.name}` : "Admin — Tournoi",
  ),
  robots: "noindex,nofollow",
});

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
const tabs = [
  { label: "Général", value: "general" },
  { label: "Accès JA", value: "ja" },
  { label: "Séries", value: "series" },
];
const activeTab = ref("general");

// ---------------------------------------------------------------------------
// Tab Général — edit tournament
// ---------------------------------------------------------------------------
const editForm = reactive({
  name: "",
  date: "",
  dateEnd: "",
  location: "",
  locationLat: undefined as number | undefined,
  locationLng: undefined as number | undefined,
  description: "",
  tableCount: 1,
  isPublished: false,
});
const editErrors = reactive<Record<string, string>>({});
const editSaving = ref(false);

watch(
  () => tournament.value,
  (t) => {
    if (!t) return;
    Object.assign(editForm, {
      name: t.name,
      date: t.date,
      dateEnd: t.dateEnd ?? "",
      location: t.location ?? "",
      locationLat: t.locationLat ?? undefined,
      locationLng: t.locationLng ?? undefined,
      description: t.description ?? "",
      tableCount: t.tableCount,
      isPublished: t.isPublished,
    });
  },
  { immediate: true },
);

const editSchema = updateTournamentInputSchema;

async function saveGeneral() {
  const result = editSchema.safeParse(editForm);
  if (!result.success) {
    result.error.issues.forEach((i) => {
      editErrors[String(i.path[0])] = i.message;
    });
    return;
  }
  Object.keys(editErrors).forEach((k) => Reflect.deleteProperty(editErrors, k));
  editSaving.value = true;
  try {
    await $fetch(`/api/admin/tournois/${slug}`, {
      method: "PATCH",
      body: editForm,
    });
    toast.add({ title: "Tournoi mis à jour", color: "success" });
    await refreshTournament();
  } catch {
    toast.add({ title: "Erreur", color: "error" });
  } finally {
    editSaving.value = false;
  }
}

async function deleteTournament() {
  if (!confirm("Supprimer ce tournoi ? Cette action est irréversible.")) return;
  try {
    await $fetch(`/api/admin/tournois/${slug}`, { method: "DELETE" });
    await navigateTo("/admin/tournois");
  } catch {
    toast.add({ title: "Erreur de suppression", color: "error" });
  }
}

// ---------------------------------------------------------------------------
// Tab JA Access
// ---------------------------------------------------------------------------
const { data: jaAccesses, refresh: refreshJa } = await useFetch<
  TournamentJaAccess[]
>(`/api/admin/tournois/${slug}/ja-access`);

// ---------------------------------------------------------------------------
// Tab Séries
// ---------------------------------------------------------------------------
const selectedSeriesId = ref<number | null>(null);
const seriesTab = ref<"registrations" | "bracket">("registrations");
const seriesDetail = ref<SeriesWithBracket | null>(null);
const loadingSeriesDetail = ref(false);
const registrations = ref<SeriesRegistration[]>([]);

async function loadSeriesDetail(id: number) {
  loadingSeriesDetail.value = true;
  try {
    seriesDetail.value = await $fetch<SeriesWithBracket>(
      `/api/admin/tournois/${slug}/series/${id}`,
    );
    registrations.value = await $fetch<SeriesRegistration[]>(
      `/api/admin/tournois/${slug}/series/${id}/registrations`,
    );
  } finally {
    loadingSeriesDetail.value = false;
  }
}

watch(selectedSeriesId, (id) => {
  if (id) loadSeriesDetail(id);
});
watch(
  () => tournament.value?.series,
  (list) => {
    if (list && list.length > 0 && !selectedSeriesId.value) {
      selectedSeriesId.value = list[0]!.id;
    }
  },
  { immediate: true },
);

// Edit series modal
const editSeriesModalOpen = ref(false);
const editSeriesSaving = ref(false);
const editSeriesForm = reactive({
  name: "",
  seriesFormat: "singles" as "singles" | "doubles",
  seriesType: "standard" as string,
  ageCategories: [] as string[],
  femalesOnly: false,
  pointsLimitMin: undefined as number | undefined,
  pointsLimitMax: undefined as number | undefined,
  maxPlayers: undefined as number | undefined,
  setsToWin: 3,
  pointsPerSet: 11,
  seriesDate: "",
  startTime: "",
});

function openEditSeries() {
  const s = currentSeries.value;
  if (!s) return;
  Object.assign(editSeriesForm, {
    name: s.name,
    seriesFormat: s.seriesFormat,
    seriesType: s.seriesType,
    ageCategories: [...(s.ageCategories ?? [])],
    femalesOnly: s.femalesOnly,
    pointsLimitMin: s.pointsLimitMin ?? undefined,
    pointsLimitMax: s.pointsLimitMax ?? undefined,
    maxPlayers: s.maxPlayers ?? undefined,
    setsToWin: s.setsToWin,
    pointsPerSet: s.pointsPerSet,
    seriesDate: s.seriesDate ?? "",
    startTime: s.startTime ?? "",
  });
  editSeriesModalOpen.value = true;
}

async function saveEditSeries() {
  if (!selectedSeriesId.value) return;
  editSeriesSaving.value = true;
  try {
    await $fetch(
      `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}`,
      {
        method: "PATCH",
        body: editSeriesForm,
      },
    );
    toast.add({ title: "Série mise à jour", color: "success" });
    await refreshTournament();
    editSeriesModalOpen.value = false;
  } catch (e: unknown) {
    const raw = (e as { data?: { message?: string } })?.data?.message;
    const msg =
      raw && raw.startsWith("[") ? "Vérifiez les champs" : (raw ?? "Erreur");
    toast.add({ title: msg, color: "error" });
  } finally {
    editSeriesSaving.value = false;
  }
}

// Create series modal
const seriesModalOpen = ref(false);
const seriesSaving = ref(false);
const seriesForm = reactive({
  name: "",
  seriesFormat: "singles" as "singles" | "doubles",
  seriesType: "standard" as string,
  ageCategories: [] as string[],
  femalesOnly: false,
  pointsLimitMin: undefined as number | undefined,
  pointsLimitMax: undefined as number | undefined,
  maxPlayers: undefined as number | undefined,
  setsToWin: 3,
  pointsPerSet: 11,
  seriesDate: "",
  startTime: "",
});
async function createSeries() {
  if (!seriesForm.name || seriesForm.name.trim().length < 2) {
    toast.add({
      title: "Le nom de la série est requis (2 caractères minimum)",
      color: "error",
    });
    return;
  }
  seriesSaving.value = true;
  try {
    await $fetch(`/api/admin/tournois/${slug}/series`, {
      method: "POST",
      body: seriesForm,
    });
    toast.add({ title: "Série créée", color: "success" });
    await refreshTournament();
    seriesModalOpen.value = false;
  } catch (e: unknown) {
    const raw = (e as { data?: { message?: string } })?.data?.message;
    // Zod errors come as JSON array — show a simple message instead
    const msg =
      raw && raw.startsWith("[")
        ? "Vérifiez les champs du formulaire"
        : (raw ?? "Erreur");
    toast.add({ title: msg, color: "error" });
  } finally {
    seriesSaving.value = false;
  }
}

async function generateBracket() {
  if (!selectedSeriesId.value) return;
  if (
    !confirm(
      'Générer le tableau ?\n\nLes inscriptions seront fermées — utilisez "Annuler le tableau" pour les rouvrir si nécessaire.',
    )
  )
    return;
  try {
    await $fetch(
      `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}/bracket/generate`,
      { method: "POST" },
    );
    toast.add({ title: "Tableau généré", color: "success" });
    await loadSeriesDetail(selectedSeriesId.value);
    await refreshTournament();
    seriesTab.value = "bracket";
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  }
}

async function regenerateBracket() {
  if (!selectedSeriesId.value) return;
  try {
    await $fetch(
      `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}/bracket/regenerate`,
      { method: "POST" },
    );
    toast.add({ title: "Tableau régénéré", color: "success" });
    await loadSeriesDetail(selectedSeriesId.value);
    await refreshTournament();
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  }
}

async function dropBracket() {
  if (!selectedSeriesId.value) return;
  if (!confirm("Supprimer le tableau ? Les inscriptions seront rouvertes."))
    return;
  try {
    await $fetch(
      `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}/bracket/drop`,
      { method: "DELETE" },
    );
    toast.add({
      title: "Tableau supprimé — inscriptions rouvertes",
      color: "success",
    });
    await loadSeriesDetail(selectedSeriesId.value);
    await refreshTournament();
    seriesTab.value = "registrations";
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  }
}

async function startSeries() {
  if (!selectedSeriesId.value) return;
  if (!confirm("Démarrer la série ? Les scores pourront être saisis.")) return;
  try {
    await $fetch(
      `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}/start`,
      { method: "POST" },
    );
    toast.add({ title: "Série démarrée", color: "success" });
    await loadSeriesDetail(selectedSeriesId.value);
    await refreshTournament();
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  }
}

const isDev = import.meta.dev;
const addRegistrationOpen = ref(false);
const seeding = ref(false);

async function devSeedSeries(count = 30) {
  if (!selectedSeriesId.value) return;
  seeding.value = true;
  try {
    const res = await $fetch<{ inserted: number }>("/api/dev/seed-series", {
      method: "POST",
      body: { seriesId: selectedSeriesId.value, count },
    });
    toast.add({
      title: `${res.inserted} ${currentSeries.value?.seriesFormat === "doubles" ? "paires fictives ajoutées" : "joueurs fictifs ajoutés"}`,
      color: "success",
    });
    await refreshRegistrations();
  } catch {
    toast.add({ title: "Erreur seed", color: "error" });
  } finally {
    seeding.value = false;
  }
}
const currentSeries = computed<TournamentSeries | undefined>(() =>
  tournament.value?.series.find((s) => s.id === selectedSeriesId.value),
);

async function refreshRegistrations() {
  if (!selectedSeriesId.value) return;
  registrations.value = await $fetch<SeriesRegistration[]>(
    `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}/registrations`,
  );
}

async function deleteSeries() {
  if (!selectedSeriesId.value || !currentSeries.value) return;
  if (
    !confirm(
      `Supprimer la série "${currentSeries.value.name}" ? Toutes les inscriptions et matchs seront supprimés.`,
    )
  )
    return;
  try {
    await $fetch(
      `/api/admin/tournois/${slug}/series/${selectedSeriesId.value}`,
      { method: "DELETE" },
    );
    selectedSeriesId.value = null;
    await refreshTournament();
  } catch (e: unknown) {
    const msg =
      (e as { data?: { message?: string } })?.data?.message ?? "Erreur";
    toast.add({ title: msg, color: "error" });
  }
}
</script>

<template>
  <div v-if="tournament" class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <NuxtLink
          to="/admin/tournois"
          class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-1"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Tous les tournois
        </NuxtLink>
        <h1 class="text-2xl font-bold">{{ tournament.name }}</h1>
      </div>
      <NuxtLink :to="`/tournois/${slug}/ja`" target="_blank">
        <UButton
          variant="outline"
          color="neutral"
          size="sm"
          icon="i-heroicons-clipboard-document-check"
        >
          Interface JA
        </UButton>
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <UTabs v-model="activeTab" :items="tabs" color="neutral" />

    <!-- Tab: Général -->
    <div v-if="activeTab === 'general'" class="space-y-4 max-w-lg">
      <UFormField label="Nom" :error="editErrors.name" required>
        <UInput v-model="editForm.name" />
      </UFormField>
      <UFormField label="Date de début" :error="editErrors.date" required>
        <UInput v-model="editForm.date" type="date" />
      </UFormField>
      <UFormField label="Date de fin (multi-jours)" :error="editErrors.dateEnd">
        <UInput v-model="editForm.dateEnd" type="date" :min="editForm.date" />
      </UFormField>
      <UFormField label="Lieu">
        <UInput v-model="editForm.location" />
      </UFormField>
      <UFormField label="Nombre de tables" :error="editErrors.tableCount">
        <UInput
          v-model.number="editForm.tableCount"
          type="number"
          min="1"
          max="100"
        />
      </UFormField>
      <UFormField label="Description">
        <UTextarea v-model="editForm.description" :rows="3" />
      </UFormField>
      <UFormField label="Publié">
        <USwitch v-model="editForm.isPublished" />
      </UFormField>
      <div class="flex gap-2 pt-2">
        <UButton :loading="editSaving" @click="saveGeneral"
          >Enregistrer</UButton
        >
        <UButton variant="ghost" color="error" @click="deleteTournament"
          >Supprimer le tournoi</UButton
        >
      </div>
    </div>

    <!-- Tab: JA Access -->
    <div v-if="activeTab === 'ja'">
      <TournamentJaAccessManager
        :accesses="jaAccesses ?? []"
        :slug="slug"
        :tournament-id="tournament.id"
        @refresh="refreshJa"
      />
    </div>

    <!-- Tab: Séries -->
    <div v-if="activeTab === 'series'" class="space-y-4">
      <div class="flex items-start gap-2 flex-wrap">
        <TournamentSeriesSelector
          :series="tournament.series"
          :model-value="selectedSeriesId"
          class="flex-1"
          @update:model-value="selectedSeriesId = $event"
        />
        <UButton icon="i-heroicons-plus" @click="seriesModalOpen = true">
          Nouvelle série
        </UButton>
      </div>

      <!-- Series detail -->
      <template v-if="currentSeries && seriesDetail">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3 flex-wrap">
            <TournamentSeriesStatusBadge :status="currentSeries.status" />
            <TournamentSeriesTypeBadge
              :type="currentSeries.seriesType"
              :points-limit-min="currentSeries.pointsLimitMin"
              :points-limit-max="currentSeries.pointsLimitMax"
            />
            <UBadge
              v-if="currentSeries.femalesOnly"
              color="pink"
              variant="solid"
              size="sm"
            >
              ♀ Féminines
            </UBadge>
            <span class="text-sm text-gray-500">
              {{ registrations.length }} inscrit{{
                registrations.length > 1 ? "s" : ""
              }}
            </span>
          </div>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            icon="i-heroicons-pencil-square"
            @click="openEditSeries"
          >
            Modifier
          </UButton>
          <UButton
            v-if="
              currentSeries.status === 'draft' ||
              currentSeries.status === 'registration'
            "
            size="sm"
            variant="ghost"
            color="error"
            icon="i-heroicons-trash"
            @click="deleteSeries"
          >
            Supprimer la série
          </UButton>
        </div>

        <!-- Sub-tabs: Inscriptions / Tableau -->
        <div class="flex gap-2">
          <UButton
            size="sm"
            :variant="seriesTab === 'registrations' ? 'solid' : 'outline'"
            color="neutral"
            @click="seriesTab = 'registrations'"
          >
            Inscriptions
          </UButton>
          <UButton
            size="sm"
            :variant="seriesTab === 'bracket' ? 'solid' : 'outline'"
            color="neutral"
            :disabled="
              currentSeries.status === 'draft' ||
              currentSeries.status === 'registration'
            "
            @click="seriesTab = 'bracket'"
          >
            Tableau
          </UButton>
        </div>

        <!-- Registrations sub-tab -->
        <div v-if="seriesTab === 'registrations'" class="space-y-3">
          <div class="flex justify-between items-center">
            <!-- Status transitions -->
            <div class="flex gap-2 flex-wrap">
              <UButton
                v-if="
                  currentSeries.status === 'draft' ||
                  currentSeries.status === 'registration'
                "
                size="sm"
                icon="i-heroicons-table-cells"
                @click="generateBracket"
              >
                Générer le tableau
              </UButton>
            </div>
            <UButton
              size="sm"
              variant="outline"
              icon="i-heroicons-user-plus"
              @click="addRegistrationOpen = true"
            >
              Inscrire
            </UButton>
            <UButton
              v-if="isDev"
              size="sm"
              color="orange"
              variant="outline"
              icon="i-heroicons-beaker"
              :loading="seeding"
              @click="devSeedSeries(30)"
            >
              [DEV] +30
              {{
                currentSeries?.seriesFormat === "doubles"
                  ? "doubles"
                  : "joueurs"
              }}
            </UButton>
          </div>
          <TournamentRegistrationTable
            :registrations="registrations"
            :series-format="currentSeries.seriesFormat"
            :slug="slug"
            :series-id="currentSeries.id"
            @refresh="refreshRegistrations"
          />
        </div>

        <!-- Bracket sub-tab -->
        <div v-if="seriesTab === 'bracket'" class="space-y-3">
          <div class="flex gap-2 flex-wrap">
            <UButton
              v-if="currentSeries.status === 'bracket_generated'"
              size="sm"
              variant="outline"
              @click="regenerateBracket"
            >
              Régénérer
            </UButton>
            <UButton
              v-if="currentSeries.status === 'bracket_generated'"
              size="sm"
              color="red"
              variant="outline"
              icon="i-heroicons-trash"
              @click="dropBracket"
            >
              Annuler le tableau
            </UButton>
            <UButton
              v-if="currentSeries.status === 'bracket_generated'"
              size="sm"
              @click="startSeries"
            >
              Démarrer la série
            </UButton>
          </div>
          <TournamentBracketEditor
            v-if="currentSeries.status === 'bracket_generated'"
            :rounds="seriesDetail.rounds"
            :series-id="currentSeries.id"
            :slug="slug"
            @refresh="loadSeriesDetail(currentSeries.id)"
          />
          <TournamentBracketView v-else :rounds="seriesDetail.rounds" />
        </div>
      </template>
    </div>

    <!-- Add registration modal -->
    <TournamentJaMultiSeriesRegistrationModal
      v-if="tournament"
      :open="addRegistrationOpen"
      :series="tournament.series"
      :slug="slug"
      api-base="/api/admin/tournois"
      @update:open="addRegistrationOpen = $event"
      @refresh="refreshRegistrations"
    />

    <!-- Edit series modal -->
    <UModal v-model:open="editSeriesModalOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="font-semibold text-lg">Modifier la série</h3>
          <UFormField label="Nom" required>
            <UInput v-model="editSeriesForm.name" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Format">
              <USelect
                v-model="editSeriesForm.seriesFormat"
                :items="[
                  { label: 'Simple', value: 'singles' },
                  { label: 'Double', value: 'doubles' },
                ]"
              />
            </UFormField>
            <UFormField label="Type">
              <USelect
                v-model="editSeriesForm.seriesType"
                :items="[
                  { label: 'Standard', value: 'standard' },
                  { label: 'Speedy', value: 'speedy' },
                  { label: 'Handicap', value: 'handicap' },
                  { label: 'Pts limités', value: 'points_limit' },
                  { label: 'Double mixte', value: 'mixed_doubles' },
                  { label: 'Coupe Davis', value: 'coupe_davis' },
                ]"
              />
            </UFormField>
          </div>
          <UFormField
            label="Catégories d'âge autorisées"
            hint="Vide = ouvert à tous"
          >
            <div class="flex flex-wrap gap-2 mt-1">
              <label
                v-for="cat in [
                  { value: 'poussin', label: 'Poussin' },
                  { value: 'benjamin', label: 'Benjamin' },
                  { value: 'minimes', label: 'Minimes' },
                  { value: 'cadets', label: 'Cadets' },
                  { value: 'juniors', label: 'Juniors' },
                  { value: 'veterans', label: 'Vétérans' },
                  { value: 'super_veterans', label: 'Super Vétérans' },
                ]"
                :key="cat.value"
                class="flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm cursor-pointer select-none transition-colors"
                :class="
                  editSeriesForm.ageCategories.includes(cat.value)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                "
              >
                <input
                  type="checkbox"
                  class="sr-only"
                  :value="cat.value"
                  :checked="editSeriesForm.ageCategories.includes(cat.value)"
                  @change="
                    editSeriesForm.ageCategories.includes(cat.value)
                      ? editSeriesForm.ageCategories.splice(
                          editSeriesForm.ageCategories.indexOf(cat.value),
                          1,
                        )
                      : editSeriesForm.ageCategories.push(cat.value)
                  "
                />
                {{ cat.label }}
              </label>
            </div>
          </UFormField>
          <UFormField label="Réservé aux féminines">
            <div class="flex items-center gap-2">
              <USwitch v-model="editSeriesForm.femalesOnly" />
              <span class="text-sm text-gray-500"
                >Seules les joueuses peuvent s'inscrire</span
              >
            </div>
          </UFormField>
          <div
            v-if="editSeriesForm.seriesType === 'points_limit'"
            class="grid grid-cols-2 gap-3"
          >
            <UFormField label="Pts min">
              <UInput
                v-model.number="editSeriesForm.pointsLimitMin"
                type="number"
                min="0"
              />
            </UFormField>
            <UFormField label="Pts max">
              <UInput
                v-model.number="editSeriesForm.pointsLimitMax"
                type="number"
                min="0"
              />
            </UFormField>
          </div>
          <div
            v-if="editSeriesForm.seriesType !== 'speedy'"
            class="grid grid-cols-2 gap-3"
          >
            <UFormField label="Sets à gagner">
              <UInput
                v-model.number="editSeriesForm.setsToWin"
                type="number"
                min="1"
                max="4"
              />
            </UFormField>
            <UFormField label="Pts / set">
              <UInput
                v-model.number="editSeriesForm.pointsPerSet"
                type="number"
                min="3"
                max="21"
              />
            </UFormField>
          </div>
          <UFormField label="Max joueurs (optionnel)">
            <UInput
              v-model.number="editSeriesForm.maxPlayers"
              type="number"
              min="2"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Date de la série (optionnel)">
              <UInput v-model="editSeriesForm.seriesDate" type="date" />
            </UFormField>
            <UFormField label="Heure de début (optionnel)">
              <UInput v-model="editSeriesForm.startTime" type="time" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="editSeriesModalOpen = false"
              >Annuler</UButton
            >
            <UButton :loading="editSeriesSaving" @click="saveEditSeries"
              >Enregistrer</UButton
            >
          </div>
        </div>
      </template>
    </UModal>

    <!-- Create series modal -->
    <UModal v-model:open="seriesModalOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="font-semibold text-lg">Nouvelle série</h3>
          <UFormField label="Nom" required>
            <UInput v-model="seriesForm.name" placeholder="Simple Hommes A" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Format">
              <USelect
                v-model="seriesForm.seriesFormat"
                :items="[
                  { label: 'Simple', value: 'singles' },
                  { label: 'Double', value: 'doubles' },
                ]"
              />
            </UFormField>
            <UFormField label="Type">
              <USelect
                v-model="seriesForm.seriesType"
                :items="[
                  { label: 'Standard', value: 'standard' },
                  { label: 'Speedy', value: 'speedy' },
                  { label: 'Handicap', value: 'handicap' },
                  { label: 'Pts limités', value: 'points_limit' },
                  { label: 'Double mixte', value: 'mixed_doubles' },
                  { label: 'Coupe Davis', value: 'coupe_davis' },
                ]"
              />
            </UFormField>
          </div>
          <!-- Age categories restriction (optional, multi-select) -->
          <UFormField
            label="Catégories d'âge autorisées"
            hint="Vide = ouvert à tous"
          >
            <div class="flex flex-wrap gap-2 mt-1">
              <label
                v-for="cat in [
                  { value: 'poussin', label: 'Poussin' },
                  { value: 'benjamin', label: 'Benjamin' },
                  { value: 'minimes', label: 'Minimes' },
                  { value: 'cadets', label: 'Cadets' },
                  { value: 'juniors', label: 'Juniors' },
                  { value: 'veterans', label: 'Vétérans' },
                  { value: 'super_veterans', label: 'Super Vétérans' },
                ]"
                :key="cat.value"
                class="flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm cursor-pointer select-none transition-colors"
                :class="
                  seriesForm.ageCategories.includes(cat.value)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                "
              >
                <input
                  type="checkbox"
                  class="sr-only"
                  :value="cat.value"
                  :checked="seriesForm.ageCategories.includes(cat.value)"
                  @change="
                    seriesForm.ageCategories.includes(cat.value)
                      ? seriesForm.ageCategories.splice(
                          seriesForm.ageCategories.indexOf(cat.value),
                          1,
                        )
                      : seriesForm.ageCategories.push(cat.value)
                  "
                />
                {{ cat.label }}
              </label>
            </div>
          </UFormField>
          <UFormField label="Réservé aux féminines">
            <div class="flex items-center gap-2">
              <USwitch v-model="seriesForm.femalesOnly" />
              <span class="text-sm text-gray-500"
                >Seules les joueuses peuvent s'inscrire</span
              >
            </div>
          </UFormField>
          <div
            v-if="seriesForm.seriesType === 'points_limit'"
            class="grid grid-cols-2 gap-3"
          >
            <UFormField label="Pts min">
              <UInput
                v-model.number="seriesForm.pointsLimitMin"
                type="number"
                min="0"
              />
            </UFormField>
            <UFormField label="Pts max">
              <UInput
                v-model.number="seriesForm.pointsLimitMax"
                type="number"
                min="0"
              />
            </UFormField>
          </div>
          <div
            v-if="seriesForm.seriesType !== 'speedy'"
            class="grid grid-cols-2 gap-3"
          >
            <UFormField label="Sets à gagner">
              <UInput
                v-model.number="seriesForm.setsToWin"
                type="number"
                min="1"
                max="4"
              />
            </UFormField>
            <UFormField label="Pts / set">
              <UInput
                v-model.number="seriesForm.pointsPerSet"
                type="number"
                min="3"
                max="21"
              />
            </UFormField>
          </div>
          <UFormField label="Max joueurs (optionnel)">
            <UInput
              v-model.number="seriesForm.maxPlayers"
              type="number"
              min="2"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Date de la série (optionnel)">
              <UInput v-model="seriesForm.seriesDate" type="date" />
            </UFormField>
            <UFormField label="Heure de début (optionnel)">
              <UInput v-model="seriesForm.startTime" type="time" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="seriesModalOpen = false"
              >Annuler</UButton
            >
            <UButton :loading="seriesSaving" @click="createSeries"
              >Créer</UButton
            >
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
