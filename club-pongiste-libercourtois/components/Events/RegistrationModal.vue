<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        >
          <!-- Background overlay -->
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            @click="$emit('close')"
          />

          <!-- Modal panel -->
          <div
            class="modal-panel inline-block align-bottom rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
          >
            <!-- Header -->
            <div class="sm:flex sm:items-start mb-6">
              <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10"
              >
                <svg
                  class="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 class="text-lg leading-6 font-medium modal-title">
                  Inscription à l'événement
                </h3>
                <div class="mt-2">
                  <p class="text-sm modal-subtitle">
                    {{ event.title }}
                  </p>
                  <p class="text-xs modal-date mt-1">
                    {{ formatDate(event.date)
                    }}{{ event.time ? ` à ${event.time}` : "" }}
                  </p>
                </div>
              </div>
              <button
                class="ml-4 modal-close-btn rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="$emit('close')"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Event Info Summary -->
            <div class="modal-info-panel rounded-lg p-4 mb-6">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div v-if="event.location">
                  <span class="font-medium modal-label">Lieu:</span>
                  <p class="modal-text">
                    {{ event.location }}
                  </p>
                </div>
                <div v-if="event.price">
                  <span class="font-medium text-gray-700">Tarif:</span>
                  <p class="text-gray-600">{{ event.price }}€</p>
                </div>
                <div v-if="event.maxParticipants">
                  <span class="font-medium text-gray-700">Places:</span>
                  <p class="text-gray-600">
                    {{ spotsRemaining }} disponible{{
                      spotsRemaining !== 1 ? "s" : ""
                    }}
                  </p>
                </div>
                <div v-if="event.registrationDeadline">
                  <span class="font-medium text-gray-700">Limite:</span>
                  <p class="text-gray-600">
                    {{ formatDate(event.registrationDeadline) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Registration Form -->
            <form class="space-y-4" @submit.prevent="handleSubmit">
              <!-- Member selection -->
              <div>
                <label
                  for="licensee"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sélectionner un licencié <span class="text-red-500">*</span>
                </label>
                <select
                  id="licensee"
                  v-model="form.licenseeId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :class="{ 'border-red-500': errors.licenseeId }"
                  @change="onLicenseeSelect"
                >
                  <option value="">Choisir un licencié...</option>
                  <option
                    v-for="licensee in licensees"
                    :key="licensee.id"
                    :value="licensee.id"
                  >
                    {{ licensee.lastName }} {{ licensee.firstName }} ({{
                      licensee.category
                    }})
                  </option>
                </select>
                <p v-if="errors.licenseeId" class="mt-1 text-xs text-red-600">
                  {{ errors.licenseeId }}
                </p>
              </div>

              <!-- Selected member information -->
              <div
                v-if="selectedLicensee"
                class="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <h4 class="font-medium text-blue-900 mb-2">
                  Informations du licencié
                </h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="font-medium text-blue-700">Nom complet:</span>
                    <p class="text-blue-600">
                      {{ selectedLicensee.firstName }}
                      {{ selectedLicensee.lastName }}
                    </p>
                  </div>
                  <div>
                    <span class="font-medium text-blue-700"
                      >Numéro de licence:</span
                    >
                    <p class="text-blue-600">
                      {{ selectedLicensee.licenseNumber }}
                    </p>
                  </div>
                  <div>
                    <span class="font-medium text-blue-700">Âge:</span>
                    <p class="text-blue-600">{{ selectedLicensee.age }} ans</p>
                  </div>
                  <div>
                    <span class="font-medium text-blue-700">Catégorie:</span>
                    <p class="text-blue-600 capitalize">
                      {{ selectedLicensee.category }}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  for="comments"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Commentaires ou demandes particulières
                </label>
                <textarea
                  id="comments"
                  v-model="form.comments"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Allergies, besoins spéciaux, questions..."
                />
              </div>

              <!-- Terms and Conditions -->
              <div class="flex items-start">
                <input
                  id="acceptTerms"
                  v-model="form.acceptTerms"
                  type="checkbox"
                  required
                  class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="acceptTerms" class="ml-2 text-sm text-gray-600">
                  J'accepte les
                  <a href="#" class="text-blue-600 hover:underline"
                    >conditions d'inscription</a
                  >
                  et autorise le club à me contacter pour cet événement
                  <span class="text-red-500">*</span>
                </label>
              </div>

              <!-- Error Display -->
              <div
                v-if="submitError"
                class="bg-red-50 border border-red-200 rounded-md p-3"
              >
                <p class="text-sm text-red-800">
                  {{ submitError }}
                </p>
              </div>

              <!-- Success Display -->
              <div
                v-if="submitSuccess"
                class="bg-green-50 border border-green-200 rounded-md p-3"
              >
                <p class="text-sm text-green-800">
                  {{ submitSuccess }}
                </p>
              </div>

              <!-- Form Actions -->
              <div
                class="flex justify-end space-x-3 pt-6 border-t border-gray-200"
              >
                <button
                  type="button"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  :disabled="isSubmitting"
                  @click="$emit('close')"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="isSubmitting || !form.acceptTerms"
                >
                  <span v-if="isSubmitting" class="flex items-center">
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Inscription en cours...
                  </span>
                  <span v-else>Confirmer l'inscription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import type { CalendarEvent, EventRegistration, Licensee } from "~/types";

interface Props {
  event: CalendarEvent;
  show: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  success: [registration: any];
}>();

// Data
const licensees = ref<Licensee[]>([]);
const isLoadingLicensees = ref(false);

// Form state
const form = reactive({
  licenseeId: "",
  comments: "",
  acceptTerms: false,
});

const errors = reactive({
  licenseeId: "",
});

const isSubmitting = ref(false);
const submitError = ref("");
const submitSuccess = ref("");

// Computed
const selectedLicensee = computed(() => {
  return licensees.value.find((l) => l.id === form.licenseeId) || null;
});

const spotsRemaining = computed(() => {
  if (!props.event.maxParticipants) return 999;
  return props.event.maxParticipants - props.event.currentParticipants;
});

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fetchLicensees = async () => {
  isLoadingLicensees.value = true;
  try {
    const response = await $fetch<{ success: boolean; licensees: Licensee[] }>(
      "/api/club/licensees",
    );
    if (response.success) {
      licensees.value = response.licensees;
    }
  } catch (error) {
    console.error("Error fetching licensees:", error);
    submitError.value = "Erreur lors du chargement des licenciés";
  } finally {
    isLoadingLicensees.value = false;
  }
};

const onLicenseeSelect = () => {
  // Clear previous errors when a licensee is selected
  errors.licenseeId = "";
};

const validateForm = () => {
  // Reset errors
  errors.licenseeId = "";

  let isValid = true;

  // Required field validation
  if (!form.licenseeId) {
    errors.licenseeId = "Veuillez sélectionner un licencié";
    isValid = false;
  }

  return isValid;
};

const resetForm = () => {
  Object.assign(form, {
    licenseeId: "",
    comments: "",
    acceptTerms: false,
  });

  errors.licenseeId = "";
  submitError.value = "";
  submitSuccess.value = "";
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  if (!selectedLicensee.value) {
    submitError.value = "Veuillez sélectionner un licencié";
    return;
  }

  isSubmitting.value = true;
  submitError.value = "";
  submitSuccess.value = "";

  try {
    const registrationData: Omit<
      EventRegistration,
      "registrationDate" | "status"
    > = {
      eventId: props.event.id,
      participant: {
        firstName: selectedLicensee.value.firstName,
        lastName: selectedLicensee.value.lastName,
        email: selectedLicensee.value.email || "",
        phone: selectedLicensee.value.phone || "",
        age: selectedLicensee.value.age,
        level: undefined, // No level for licensees
        licenseNumber: selectedLicensee.value.licenseNumber,
        comments: form.comments?.trim() || undefined,
      },
    };

    const response = await $fetch<any>("/api/events/register", {
      method: "POST",
      body: registrationData,
    });

    if (response.success) {
      submitSuccess.value = response.message;
      emit("success", response);

      // Close modal after a delay
      setTimeout(() => {
        resetForm();
        emit("close");
      }, 2000);
    } else {
      submitError.value = response.message || "Erreur lors de l'inscription";
    }
  } catch (error: any) {
    console.error("Registration error:", error);
    submitError.value =
      error?.data?.message ||
      "Erreur lors de l'inscription. Veuillez réessayer.";
  } finally {
    isSubmitting.value = false;
  }
};

// Watch for modal close to reset form and load licensees
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      fetchLicensees();
    } else {
      resetForm();
    }
  },
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .inline-block,
.modal-leave-active .inline-block {
  transition: transform 0.3s ease;
}

.modal-enter-from .inline-block,
.modal-leave-to .inline-block {
  transform: scale(0.95);
}

/* Styles adaptatifs pour les modes clair/sombre */
.modal-panel {
  background-color: var(--card-bg);
  color: var(--text-primary);
}

.modal-title {
  color: var(--text-primary);
}

.modal-subtitle {
  color: var(--text-secondary);
}

.modal-date {
  color: var(--text-secondary);
  opacity: 0.8;
}

.modal-close-btn {
  background-color: var(--card-bg);
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.modal-close-btn:hover {
  color: var(--text-primary);
}

.modal-info-panel {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.modal-label {
  color: var(--text-primary);
}

.modal-text {
  color: var(--text-secondary);
}
</style>
