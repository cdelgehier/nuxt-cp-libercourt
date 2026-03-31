<template>
  <UModal :open="show" @update:open="$emit('close')">
    <template #content>
      <div class="p-6 space-y-4">
        <div>
          <h3 class="font-semibold text-lg">Inscription</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ event.title }}
          </p>
          <p v-if="event.date" class="text-xs text-gray-400 mt-0.5">
            {{ formatDate(event.date) }}
            <span v-if="event.time"> à {{ event.time }}</span>
          </p>
        </div>

        <!-- Event summary -->
        <div
          v-if="event.location || event.price || event.maxParticipants"
          class="grid grid-cols-2 gap-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
        >
          <div v-if="event.location">
            <span class="font-medium text-gray-600 dark:text-gray-400"
              >Lieu</span
            >
            <p class="text-gray-800 dark:text-gray-200">{{ event.location }}</p>
          </div>
          <div v-if="event.price">
            <span class="font-medium text-gray-600 dark:text-gray-400"
              >Tarif</span
            >
            <p class="text-gray-800 dark:text-gray-200">{{ event.price }}€</p>
          </div>
          <div v-if="event.maxParticipants">
            <span class="font-medium text-gray-600 dark:text-gray-400"
              >Places</span
            >
            <p class="text-gray-800 dark:text-gray-200">
              {{ spotsRemaining }} restante{{ spotsRemaining !== 1 ? "s" : "" }}
            </p>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Nom + Prénom avec autocomplete sur Nom -->
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Nom" :error="errors.lastName" required>
              <div class="relative">
                <UInput
                  :model-value="form.lastName"
                  placeholder="DUPONT"
                  autocomplete="off"
                  :ui="{ base: 'w-full' }"
                  @update:model-value="onLastNameInput(String($event))"
                  @blur="closeSuggestions"
                />
                <div
                  v-if="showSuggestions"
                  class="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-52 overflow-y-auto"
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
                    class="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    @mousedown.prevent="selectSuggestion(p)"
                  >
                    <span class="font-medium text-sm"
                      >{{ p.lastName }} {{ p.firstName }}</span
                    >
                    <span class="text-xs text-gray-400 ml-2">{{ p.club }}</span>
                  </button>
                </div>
              </div>
            </UFormField>

            <UFormField label="Prénom" :error="errors.firstName" required>
              <UInput
                :model-value="form.firstName"
                placeholder="Jean"
                @update:model-value="
                  (v: string) => {
                    form.firstName = String(v);
                    refetchIfNeeded();
                  }
                "
              />
            </UFormField>
          </div>

          <!-- Accompagnants -->
          <UFormField label="Accompagnants">
            <USelect
              v-model="form.companions"
              :items="companionsOptions"
              value-key="value"
              label-key="label"
            />
          </UFormField>

          <!-- Email -->
          <UFormField label="Email" hint="facultatif" :error="errors.email">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="jean.dupont@exemple.fr"
              autocomplete="email"
            />
          </UFormField>

          <!-- Téléphone -->
          <UFormField label="Téléphone" hint="facultatif">
            <UInput
              v-model="form.phone"
              type="tel"
              placeholder="06 01 02 03 04"
              autocomplete="tel"
            />
          </UFormField>

          <!-- Notes -->
          <UFormField
            label="Remarques"
            hint="facultatif — visible uniquement par les admins"
          >
            <UTextarea
              v-model="form.notes"
              :rows="2"
              placeholder="Allergies, besoins spéciaux..."
              :maxlength="500"
            />
          </UFormField>

          <!-- Error / Success -->
          <UAlert
            v-if="submitError"
            color="error"
            variant="soft"
            :description="submitError"
          />
          <UAlert
            v-if="submitSuccess"
            color="success"
            variant="soft"
            :description="submitSuccess"
          />

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="isSubmitting"
              @click="$emit('close')"
            >
              Annuler
            </UButton>
            <UButton type="submit" :loading="isSubmitting"> Confirmer </UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  event: {
    id: string | number;
    title: string;
    date?: string;
    time?: string | null;
    location?: string | null;
    price?: number | null;
    maxParticipants?: number | null;
    currentParticipants?: number;
    registrationDeadline?: string | null;
    [key: string]: unknown;
  };
  show: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  success: [registration: unknown];
}>();

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

const form = reactive({
  firstName: "",
  lastName: "",
  companions: 0,
  email: "",
  phone: "",
  notes: "",
});

const errors = reactive({ firstName: "", lastName: "", email: "" });
const isSubmitting = ref(false);
const submitError = ref("");
const submitSuccess = ref("");

const spotsRemaining = computed(() => {
  if (!props.event.maxParticipants) return 999;
  return props.event.maxParticipants - (props.event.currentParticipants ?? 0);
});

const companionsOptions = Array.from({ length: 21 }, (_, i) => ({
  value: i,
  label: i === 0 ? "Aucun (juste moi)" : `${i} accompagnant${i > 1 ? "s" : ""}`,
}));

// ---------------------------------------------------------------------------
// Autocomplete SmartPing — intégré dans le champ Nom (même pattern que tournoi)
// ---------------------------------------------------------------------------

interface PlayerSuggestion {
  lastName: string;
  firstName: string;
  licence: string;
  club: string;
  ranking?: number;
}

const suggestions = ref<PlayerSuggestion[]>([]);
const showSuggestions = ref(false);
const searchLoading = ref(false);
const tooManyResults = ref(false);
const RESULTS_THRESHOLD = 15;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function fetchSuggestions() {
  if (form.lastName.length < 2) return;
  searchLoading.value = true;
  try {
    const params: Record<string, string> = {
      nom: form.lastName,
      clubOnly: "true",
    };
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

function onLastNameInput(value: string) {
  form.lastName = value;
  tooManyResults.value = false;
  suggestions.value = [];
  showSuggestions.value = false;
  if (value.length < 2) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSuggestions(), 300);
}

function refetchIfNeeded() {
  if (form.lastName.length >= 2) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(), 300);
  }
}

function selectSuggestion(p: PlayerSuggestion) {
  form.lastName = p.lastName;
  form.firstName = p.firstName;
  suggestions.value = [];
  showSuggestions.value = false;
  tooManyResults.value = false;
}

function closeSuggestions() {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
}

// ---------------------------------------------------------------------------
// Form actions
// ---------------------------------------------------------------------------

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

function validateForm() {
  errors.firstName = "";
  errors.lastName = "";
  errors.email = "";
  let ok = true;
  if (!form.firstName || form.firstName.trim().length < 2) {
    errors.firstName = "Prénom requis (min. 2 caractères)";
    ok = false;
  }
  if (!form.lastName || form.lastName.trim().length < 2) {
    errors.lastName = "Nom requis (min. 2 caractères)";
    ok = false;
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Format d'email invalide";
    ok = false;
  }
  return ok;
}

function resetForm() {
  Object.assign(form, {
    firstName: "",
    lastName: "",
    companions: 0,
    email: "",
    phone: "",
    notes: "",
  });
  errors.firstName = "";
  errors.lastName = "";
  errors.email = "";
  submitError.value = "";
  submitSuccess.value = "";
  suggestions.value = [];
  showSuggestions.value = false;
}

async function handleSubmit() {
  if (!validateForm()) return;
  isSubmitting.value = true;
  submitError.value = "";
  submitSuccess.value = "";
  try {
    const response = await $fetch<{ id: number }>("/api/events/register", {
      method: "POST",
      body: {
        eventId: props.event.id,
        participant: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          companions: form.companions,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
      },
    });
    submitSuccess.value = "Inscription confirmée !";
    emit("success", response);
    setTimeout(() => {
      resetForm();
      emit("close");
    }, 1500);
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } };
    submitError.value =
      err?.data?.message || "Erreur lors de la soumission. Veuillez réessayer.";
  } finally {
    isSubmitting.value = false;
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

watch(
  () => props.show,
  (open) => {
    if (!open) resetForm();
  },
);
</script>
