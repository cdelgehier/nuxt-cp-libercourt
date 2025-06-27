<template>
  <div>
    <!-- Intermediate Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-3xl font-bold text-white sm:text-4xl mb-4">
            Documents
            <span class="text-club-yellow">FFTT</span>
          </h1>
          <p class="text-xl text-gray-200 max-w-3xl mx-auto">
            Administration et gestion des documents officiels FFTT
          </p>
        </div>
      </div>
    </section>

    <div class="min-h-screen bg-gray-100 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="adaptive-card rounded-lg shadow-lg p-8">
          <!-- Status -->
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold mb-4">État du scraping</h2>
              <UButton
                @click="refreshDocuments"
                :loading="loading"
                color="primary"
                variant="outline"
              >
                <UIcon name="i-heroicons-arrow-path" class="mr-2" />
                Actualiser
              </UButton>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center">
                  <UIcon
                    name="i-heroicons-check-circle"
                    class="text-green-500 mr-3"
                  />
                  <div>
                    <div class="font-semibold text-green-800">Statut</div>
                    <div class="text-sm text-green-600">
                      {{ ffttData?.success ? "Succès" : "Échec" }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center">
                  <UIcon
                    name="i-heroicons-document-text"
                    class="text-blue-500 mr-3"
                  />
                  <div>
                    <div class="font-semibold text-blue-800">
                      Documents trouvés
                    </div>
                    <div class="text-sm text-blue-600">
                      {{ documentsFound }}/4
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div class="flex items-center">
                  <UIcon name="i-heroicons-clock" class="text-gray-500 mr-3" />
                  <div>
                    <div class="font-semibold text-gray-800">Dernier scan</div>
                    <div class="text-sm text-gray-600">
                      {{ lastScrapeFormatted }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Documents found -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Documents FFTT détectés</h2>

            <div class="space-y-4">
              <div
                v-for="(doc, key) in documentsData"
                :key="key"
                class="border border-gray-200 rounded-lg p-4"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <UIcon
                        :name="
                          doc
                            ? 'i-heroicons-check-circle'
                            : 'i-heroicons-x-circle'
                        "
                        :class="doc ? 'text-green-500' : 'text-red-500'"
                        class="mr-2"
                      />
                      <h3 class="font-semibold">{{ getDocumentTitle(key) }}</h3>
                    </div>

                    <div v-if="doc" class="space-y-2">
                      <div class="text-sm text-gray-600">
                        <strong>Nom détecté:</strong> {{ doc.name }}
                      </div>
                      <div class="text-sm text-gray-600">
                        <strong>URL:</strong>
                        <a
                          :href="doc.url"
                          target="_blank"
                          class="text-blue-600 hover:text-blue-800 underline"
                        >
                          {{ doc.url }}
                        </a>
                      </div>
                      <div class="text-xs text-gray-500">
                        Mis à jour: {{ formatDate(doc.lastUpdated) }}
                      </div>
                    </div>

                    <div v-else class="text-sm text-red-600">
                      Document non trouvé automatiquement
                    </div>
                  </div>

                  <UButton
                    v-if="doc"
                    :href="doc.url"
                    target="_blank"
                    color="blue"
                    variant="outline"
                    size="sm"
                  >
                    <UIcon
                      name="i-heroicons-arrow-top-right-on-square"
                      class="mr-1"
                    />
                    Ouvrir
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <!-- Test integration -->
          <div>
            <h2 class="text-xl font-semibold mb-4">Test d'intégration</h2>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm text-gray-600 mb-4">
                Tester si les URLs sont correctement intégrées dans l'API des
                horaires-tarifs :
              </p>
              <UButton
                @click="testIntegration"
                :loading="testingIntegration"
                color="green"
                variant="outline"
              >
                <UIcon name="i-heroicons-beaker" class="mr-2" />
                Tester l'intégration
              </UButton>

              <div
                v-if="integrationResult"
                class="mt-4 p-3 adaptive-card rounded border"
              >
                <pre class="text-xs overflow-x-auto adaptive-text">{{
                  JSON.stringify(integrationResult, null, 2)
                }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Protection: this page should only be accessible in development
if (process.env.NODE_ENV === "production") {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
  });
}

useSeoMeta({
  title: "Admin - Documents FFTT",
  robots: "noindex,nofollow",
});

// State
const loading = ref(false);
const testingIntegration = ref(false);
const ffttData = ref<any>(null);
const integrationResult = ref<any>(null);

// Load data on mount
onMounted(async () => {
  await refreshDocuments();
});

// Fonctions
async function refreshDocuments() {
  loading.value = true;
  try {
    ffttData.value = await $fetch("/api/fftt/documents");
  } catch (error) {
    console.error("Erreur lors du chargement des documents FFTT:", error);
  } finally {
    loading.value = false;
  }
}

async function testIntegration() {
  testingIntegration.value = true;
  try {
    const result = await $fetch("/api/club/schedules-pricing");
    integrationResult.value = result.registration.documents;
  } catch (error: any) {
    console.error("Erreur lors du test d'intégration:", error);
    integrationResult.value = { error: error?.message || "Erreur inconnue" };
  } finally {
    testingIntegration.value = false;
  }
}

// Computed
const documentsData = computed(() => {
  if (!ffttData.value) return {};

  return {
    bordereau_licence: ffttData.value.bordereau_licence,
    questionnaire_majeurs: ffttData.value.questionnaire_majeurs,
    questionnaire_mineurs: ffttData.value.questionnaire_mineurs,
    certificat_medical: ffttData.value.certificat_medical,
  };
});

const documentsFound = computed(() => {
  return Object.values(documentsData.value).filter(Boolean).length;
});

const lastScrapeFormatted = computed(() => {
  if (!ffttData.value?.lastScrape) return "N/A";
  return new Date(ffttData.value.lastScrape).toLocaleString("fr-FR");
});

// Utilitaires
function getDocumentTitle(key: string): string {
  const titles: Record<string, string> = {
    bordereau_licence: "Bordereau de demande de Licence",
    questionnaire_majeurs: "Autoquestionnaire Médical (Majeurs)",
    questionnaire_mineurs: "Autoquestionnaire Médical (Mineurs)",
    certificat_medical: "Certificat Médical",
  };
  return titles[key] || key;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("fr-FR");
}
</script>
