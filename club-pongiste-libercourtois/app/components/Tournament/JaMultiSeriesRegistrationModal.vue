<script setup lang="ts">
import { z } from "zod";
import type { TournamentSeries } from "~~/server/domains/tournament/types";
const { toAgeCategory } = useFfttCategories();

interface PlayerSuggestion {
  licence: string;
  lastName: string;
  firstName: string;
  club: string;
  ranking: number;
}

const props = defineProps<{
  open: boolean;
  series: TournamentSeries[];
  slug: string;
  apiBase?: string;
}>();

const base = computed(() => props.apiBase ?? "/api/ja/tournois");

const emit = defineEmits<{ "update:open": [boolean]; refresh: [] }>();
const toast = useToast();
const saving = ref(false);

const form = reactive({
  firstName: "",
  lastName: "",
  club: "",
  licenceNumber: "",
  ranking: undefined as number | undefined,
  playerCategory: undefined as string | undefined,
  playerGender: undefined as "M" | "F" | undefined,
  // Partner (doubles)
  partnerFirstName: "",
  partnerLastName: "",
  partnerClub: "",
  partnerLicenceNumber: "",
  partnerRanking: undefined as number | undefined,
});

const ageCategory = ref<string>("");

// Series selection
const selectedSeriesIds = ref<number[]>([]);

const openSeries = computed(() =>
  props.series.filter(
    (s) => s.status === "draft" || s.status === "registration",
  ),
);

const isDoublesSelected = computed(() =>
  props.series.some(
    (s) =>
      selectedSeriesIds.value.includes(s.id) && s.seriesFormat === "doubles",
  ),
);

const errors = reactive<Record<string, string>>({});

const schema = computed(() => {
  const base = z.object({
    firstName: z.string().min(1, "Requis"),
    lastName: z.string().min(1, "Requis"),
    club: z.string().optional(),
    licenceNumber: z.string().optional(),
    ranking: z.number().nonnegative().optional(),
  });
  if (isDoublesSelected.value) {
    return base.extend({
      partnerFirstName: z.string().min(1, "Requis"),
      partnerLastName: z.string().min(1, "Requis"),
    });
  }
  return base;
});

// ---------------------------------------------------------------------------
// SmartPing autocomplete — joueur principal
// ---------------------------------------------------------------------------
const suggestions = ref<PlayerSuggestion[]>([]);
const showSuggestions = ref(false);
const searchLoading = ref(false);
const tooManyResults = ref(false);
const RESULTS_THRESHOLD = 15;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function onLastNameInput(value: string) {
  form.lastName = value;
  tooManyResults.value = false;
  suggestions.value = [];
  showSuggestions.value = false;
  if (value.length < 2) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSuggestions(), 300);
}

async function fetchSuggestions() {
  if (form.lastName.length < 2) return;
  searchLoading.value = true;
  try {
    const params: Record<string, string> = { nom: form.lastName };
    if (form.firstName) params.prenom = form.firstName;
    const results = await $fetch<PlayerSuggestion[]>("/api/smartping/players", {
      query: params,
    });
    if (results.length > RESULTS_THRESHOLD) {
      tooManyResults.value = true;
      suggestions.value = [];
    } else {
      tooManyResults.value = false;
      suggestions.value = results;
    }
    showSuggestions.value = true;
  } catch {
    // silently ignore
  } finally {
    searchLoading.value = false;
  }
}

async function selectSuggestion(player: PlayerSuggestion) {
  form.lastName = player.lastName;
  form.firstName = player.firstName;
  form.club = player.club;
  form.licenceNumber = player.licence;
  form.ranking = player.ranking || undefined;
  suggestions.value = [];
  showSuggestions.value = false;
  tooManyResults.value = false;

  if (player.licence) {
    try {
      const detail = await $fetch<{
        licensee: {
          cat?: string;
          categoryDecoded?: string;
          points?: number;
          pointm?: string;
        } | null;
      }>(`/api/club/licensee/${player.licence}`);
      ageCategory.value = detail?.licensee?.categoryDecoded ?? "";
      form.playerCategory =
        toAgeCategory(detail?.licensee?.cat ?? "") ?? undefined;
      const sex = (
        detail?.licensee as { sexe?: string } | null
      )?.sexe?.toUpperCase();
      form.playerGender = sex === "M" || sex === "F" ? sex : undefined;
      const pts =
        detail?.licensee?.points ||
        parseInt(detail?.licensee?.pointm ?? "0", 10);
      if (pts) form.ranking = pts;
    } catch {
      ageCategory.value = "";
    }
  }
}

function onFirstNameInput(value: string) {
  form.firstName = value;
  if (form.lastName.length >= 2) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(), 300);
  }
}

function closeSuggestions() {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
}

// ---------------------------------------------------------------------------
// SmartPing autocomplete — partenaire
// ---------------------------------------------------------------------------
const partnerSuggestions = ref<PlayerSuggestion[]>([]);
const showPartnerSuggestions = ref(false);
const partnerSearchLoading = ref(false);
const partnerTooManyResults = ref(false);
let partnerDebounceTimer: ReturnType<typeof setTimeout> | null = null;

async function onPartnerLastNameInput(value: string) {
  form.partnerLastName = value;
  partnerTooManyResults.value = false;
  partnerSuggestions.value = [];
  showPartnerSuggestions.value = false;
  if (value.length < 2) return;
  if (partnerDebounceTimer) clearTimeout(partnerDebounceTimer);
  partnerDebounceTimer = setTimeout(() => fetchPartnerSuggestions(), 300);
}

async function fetchPartnerSuggestions() {
  if (form.partnerLastName.length < 2) return;
  partnerSearchLoading.value = true;
  try {
    const params: Record<string, string> = { nom: form.partnerLastName };
    if (form.partnerFirstName) params.prenom = form.partnerFirstName;
    const results = await $fetch<PlayerSuggestion[]>("/api/smartping/players", {
      query: params,
    });
    if (results.length > RESULTS_THRESHOLD) {
      partnerTooManyResults.value = true;
      partnerSuggestions.value = [];
    } else {
      partnerTooManyResults.value = false;
      partnerSuggestions.value = results;
    }
    showPartnerSuggestions.value = true;
  } catch {
    // silently ignore
  } finally {
    partnerSearchLoading.value = false;
  }
}

async function selectPartnerSuggestion(player: PlayerSuggestion) {
  form.partnerLastName = player.lastName;
  form.partnerFirstName = player.firstName;
  form.partnerClub = player.club;
  form.partnerLicenceNumber = player.licence;
  form.partnerRanking = player.ranking || undefined;
  partnerSuggestions.value = [];
  showPartnerSuggestions.value = false;
  partnerTooManyResults.value = false;

  // Fetch ranking from licence details
  if (player.licence) {
    try {
      const detail = await $fetch<{
        licensee: { points?: number; pointm?: string } | null;
      }>(`/api/club/licensee/${player.licence}`);
      const pts =
        detail?.licensee?.points ||
        parseInt(detail?.licensee?.pointm ?? "0", 10);
      if (pts) form.partnerRanking = pts;
    } catch {
      // silently ignore
    }
  }
}

function onPartnerFirstNameInput(value: string) {
  form.partnerFirstName = value;
  if (form.partnerLastName.length >= 2) {
    if (partnerDebounceTimer) clearTimeout(partnerDebounceTimer);
    partnerDebounceTimer = setTimeout(() => fetchPartnerSuggestions(), 300);
  }
}

function closePartnerSuggestions() {
  setTimeout(() => {
    showPartnerSuggestions.value = false;
  }, 150);
}

// ---------------------------------------------------------------------------

function resetForm() {
  Object.assign(form, {
    firstName: "",
    lastName: "",
    club: "",
    licenceNumber: "",
    ranking: undefined,
    playerCategory: undefined,
    playerGender: undefined,
    partnerFirstName: "",
    partnerLastName: "",
    partnerClub: "",
    partnerLicenceNumber: "",
    partnerRanking: undefined,
  });
  selectedSeriesIds.value = [];
  ageCategory.value = "";
  suggestions.value = [];
  showSuggestions.value = false;
  tooManyResults.value = false;
  partnerSuggestions.value = [];
  showPartnerSuggestions.value = false;
  partnerTooManyResults.value = false;
  Object.keys(errors).forEach((k) => Reflect.deleteProperty(errors, k));
}

function toggleSeries(id: number) {
  const idx = selectedSeriesIds.value.indexOf(id);
  if (idx === -1) selectedSeriesIds.value.push(id);
  else selectedSeriesIds.value.splice(idx, 1);
}

async function save() {
  const result = schema.value.safeParse(form);
  if (!result.success) {
    result.error.issues.forEach((i) => {
      errors[String(i.path[0])] = i.message;
    });
    return;
  }
  if (selectedSeriesIds.value.length === 0) {
    toast.add({ title: "Sélectionnez au moins une série", color: "warning" });
    return;
  }
  Object.keys(errors).forEach((k) => Reflect.deleteProperty(errors, k));
  saving.value = true;

  const results = await Promise.allSettled(
    selectedSeriesIds.value.map((seriesId) =>
      $fetch(`${base.value}/${props.slug}/series/${seriesId}/registrations`, {
        method: "POST",
        body: form,
      }),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected");
  const succeeded = results.filter((r) => r.status === "fulfilled");

  if (succeeded.length > 0) {
    toast.add({
      title: `${succeeded.length} inscription${succeeded.length > 1 ? "s" : ""} enregistrée${succeeded.length > 1 ? "s" : ""}`,
      color: "success",
    });
    for (const r of succeeded) {
      const data = (r as PromiseFulfilledResult<{ warning?: string | null }>)
        .value;
      if (data?.warning) {
        toast.add({ title: data.warning, color: "warning", duration: 8000 });
      }
    }
    emit("refresh");
  }
  if (failed.length > 0) {
    const msgs = failed
      .map(
        (r) => (r as PromiseRejectedResult).reason?.data?.message ?? "Erreur",
      )
      .join(", ");
    toast.add({ title: msgs, color: "error" });
  }

  saving.value = false;
  if (failed.length === 0) {
    emit("update:open", false);
    resetForm();
  }
}

watch(
  () => props.open,
  (v) => {
    if (!v) resetForm();
  },
);
</script>

<template>
  <UModal :open="open" @update:open="$emit('update:open', $event)">
    <template #content>
      <div class="p-6 space-y-4">
        <h3 class="font-semibold text-lg">
          {{ isDoublesSelected ? "Inscrire une paire" : "Inscrire un joueur" }}
        </h3>

        <!-- Joueur principal -->
        <div>
          <p
            v-if="isDoublesSelected"
            class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2"
          >
            Joueur 1
          </p>
          <div class="grid grid-cols-2 gap-3">
            <!-- Nom avec autocomplete -->
            <UFormField
              label="Nom"
              :error="errors.lastName"
              required
              class="relative"
            >
              <UInput
                :model-value="form.lastName"
                placeholder="DUPONT"
                autocomplete="off"
                @update:model-value="onLastNameInput(String($event))"
                @blur="closeSuggestions"
              />
              <div
                v-if="showSuggestions"
                class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-if="searchLoading"
                  class="px-3 py-2 text-sm text-gray-400"
                >
                  Recherche...
                </div>
                <div
                  v-else-if="tooManyResults"
                  class="px-3 py-2 text-sm text-amber-600"
                >
                  Trop de résultats — précisez le prénom
                </div>
                <div
                  v-else-if="suggestions.length === 0"
                  class="px-3 py-2 text-sm text-gray-400"
                >
                  Aucun résultat
                </div>
                <button
                  v-for="p in suggestions"
                  :key="p.licence"
                  type="button"
                  class="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  @mousedown.prevent="selectSuggestion(p)"
                >
                  <span class="font-medium text-sm"
                    >{{ p.lastName }} {{ p.firstName }}</span
                  >
                  <span class="text-xs text-gray-400 ml-2">{{ p.club }}</span>
                  <span v-if="p.ranking" class="text-xs text-blue-500 ml-2"
                    >{{ p.ranking }} pts</span
                  >
                </button>
              </div>
            </UFormField>

            <UFormField label="Prénom" :error="errors.firstName" required>
              <UInput
                :model-value="form.firstName"
                placeholder="Jean"
                @update:model-value="onFirstNameInput(String($event))"
              />
            </UFormField>

            <UFormField label="Club">
              <UInput v-model="form.club" placeholder="CPL" />
            </UFormField>

            <UFormField label="N° Licence">
              <UInput v-model="form.licenceNumber" placeholder="123456X" />
            </UFormField>

            <UFormField label="Points FFTT">
              <UInput
                v-model.number="form.ranking"
                type="number"
                min="0"
                placeholder="750"
              />
            </UFormField>

            <UFormField v-if="ageCategory" label="Catégorie">
              <UInput :model-value="ageCategory" disabled />
            </UFormField>
          </div>
        </div>

        <!-- Partenaire (doubles) -->
        <div v-if="isDoublesSelected" class="border-t pt-4">
          <p
            class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2"
          >
            Joueur 2 (partenaire)
          </p>
          <div class="grid grid-cols-2 gap-3">
            <!-- Nom partenaire avec autocomplete -->
            <UFormField
              label="Nom"
              :error="errors.partnerLastName"
              required
              class="relative"
            >
              <UInput
                :model-value="form.partnerLastName"
                placeholder="MARTIN"
                autocomplete="off"
                @update:model-value="onPartnerLastNameInput(String($event))"
                @blur="closePartnerSuggestions"
              />
              <div
                v-if="showPartnerSuggestions"
                class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-if="partnerSearchLoading"
                  class="px-3 py-2 text-sm text-gray-400"
                >
                  Recherche...
                </div>
                <div
                  v-else-if="partnerTooManyResults"
                  class="px-3 py-2 text-sm text-amber-600"
                >
                  Trop de résultats — précisez le prénom
                </div>
                <div
                  v-else-if="partnerSuggestions.length === 0"
                  class="px-3 py-2 text-sm text-gray-400"
                >
                  Aucun résultat
                </div>
                <button
                  v-for="p in partnerSuggestions"
                  :key="p.licence"
                  type="button"
                  class="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  @mousedown.prevent="selectPartnerSuggestion(p)"
                >
                  <span class="font-medium text-sm"
                    >{{ p.lastName }} {{ p.firstName }}</span
                  >
                  <span class="text-xs text-gray-400 ml-2">{{ p.club }}</span>
                  <span v-if="p.ranking" class="text-xs text-blue-500 ml-2"
                    >{{ p.ranking }} pts</span
                  >
                </button>
              </div>
            </UFormField>

            <UFormField
              label="Prénom"
              :error="errors.partnerFirstName"
              required
            >
              <UInput
                :model-value="form.partnerFirstName"
                placeholder="Marie"
                @update:model-value="onPartnerFirstNameInput(String($event))"
              />
            </UFormField>

            <UFormField label="Club">
              <UInput v-model="form.partnerClub" placeholder="CPL" />
            </UFormField>

            <UFormField label="N° Licence">
              <UInput
                v-model="form.partnerLicenceNumber"
                placeholder="654321Y"
              />
            </UFormField>

            <UFormField label="Points FFTT">
              <UInput
                v-model.number="form.partnerRanking"
                type="number"
                min="0"
                placeholder="600"
              />
            </UFormField>
          </div>
        </div>

        <!-- Series selection -->
        <div>
          <p class="text-sm font-medium mb-2">
            Séries <span class="text-red-500">*</span>
          </p>
          <div class="space-y-2">
            <label
              v-for="s in openSeries"
              :key="s.id"
              class="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50"
              :class="{
                'border-primary-400 bg-primary-50': selectedSeriesIds.includes(
                  s.id,
                ),
                'border-gray-200': !selectedSeriesIds.includes(s.id),
              }"
            >
              <input
                type="checkbox"
                :checked="selectedSeriesIds.includes(s.id)"
                class="rounded"
                @change="toggleSeries(s.id)"
              />
              <span class="text-sm font-medium">{{ s.name }}</span>
              <span
                v-if="s.seriesFormat === 'doubles'"
                class="text-xs text-purple-600 font-medium"
                >Double</span
              >
              <TournamentSeriesStatusBadge :status="s.status" class="ml-auto" />
            </label>
          </div>
          <p v-if="openSeries.length === 0" class="text-sm text-gray-400 py-2">
            Aucune série disponible pour les inscriptions.
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="$emit('update:open', false)"
          >
            Annuler
          </UButton>
          <UButton :loading="saving" @click="save">
            Inscrire
            <span v-if="selectedSeriesIds.length > 0">
              ({{ selectedSeriesIds.length }} série{{
                selectedSeriesIds.length > 1 ? "s" : ""
              }})
            </span>
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
