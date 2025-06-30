<template>
  <div>
    <!-- Intermediate Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-3xl font-bold text-white sm:text-4xl mb-4">
            Horaires et
            <span class="text-club-yellow">Tarifs</span>
          </h1>
          <p class="text-xl text-gray-200 max-w-3xl mx-auto">
            Découvrez nos créneaux d'entraînement et nos tarifs adaptés à tous
            les âges et tous les niveaux
          </p>
        </div>
      </div>
    </section>

    <!-- Training schedules -->
    <section id="schedules" class="py-16 page-section">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">
            Horaires d'Entraînement
          </h2>
          <p class="text-lg adaptive-text max-w-3xl mx-auto">
            Des créneaux adaptés à tous les âges et tous les niveaux, encadrés
            par nos entraîneurs diplômés
          </p>
        </div>

        <!-- Planning hebdomadaire -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          <div
            v-for="daySchedule in data.schedules.training"
            :key="daySchedule.day"
            class="adaptive-card rounded-xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div class="bg-club-navy text-white px-6 py-4">
              <h3 class="text-xl font-bold">
                {{ daySchedule.day }}
              </h3>
            </div>
            <div class="p-6 space-y-4">
              <div
                v-for="(session, index) in daySchedule.sessions"
                :key="index"
                class="border-l-4 border-club-yellow pl-4 py-2"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="font-bold adaptive-title">{{
                    session.time
                  }}</span>
                  <span
                    class="text-xs bg-club-green text-white px-2 py-1 rounded-full"
                  >
                    {{ session.coach }}
                  </span>
                </div>
                <div class="adaptive-text-primary font-medium">
                  {{ session.category }}
                </div>
                <div class="text-xs adaptive-text">
                  {{ session.level }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Competitions -->
        <div class="adaptive-bg-secondary rounded-xl p-8">
          <h3 class="text-2xl font-bold adaptive-title mb-6 text-center">
            Compétitions
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="competition in data.schedules.competitions"
              :key="competition.day"
              class="adaptive-card rounded-lg p-6"
            >
              <div class="flex items-center mb-3">
                <UIcon
                  name="i-heroicons-trophy"
                  class="text-club-yellow text-xl mr-2"
                />
                <h4 class="font-bold adaptive-title">
                  {{ competition.day }}
                </h4>
              </div>
              <div class="text-sm adaptive-text mb-2">
                {{ competition.time }}
              </div>
              <div class="adaptive-text-primary mb-2">
                {{ competition.description }}
              </div>
              <div class="text-xs adaptive-text italic">
                {{ competition.note }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tarifs -->
    <section id="pricing" class="py-16 adaptive-bg-secondary">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">Nos Tarifs</h2>
          <p class="text-lg adaptive-text max-w-3xl mx-auto">
            Des tarifs accessibles pour une pratique de qualité, avec de
            nombreux avantages inclus
          </p>
        </div>

        <!-- Tarifs annuels -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div
            v-for="pricing in data.pricing.annual"
            :key="pricing.category"
            class="adaptive-card rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div
              class="bg-gradient-to-r from-club-navy to-club-green text-white px-6 py-8 text-center"
            >
              <h3 class="text-xl font-bold mb-2">
                {{ pricing.category }}
              </h3>
              <div class="text-sm text-gray-200 mb-4">
                {{ pricing.ageRange }}
              </div>
              <div class="text-4xl font-bold text-club-yellow">
                {{ pricing.price }}€
              </div>
              <div class="text-sm text-gray-200">par an</div>
            </div>
            <div class="p-6">
              <ul class="space-y-3">
                <li
                  v-for="include in pricing.includes"
                  :key="include"
                  class="flex items-start text-sm adaptive-text-primary"
                >
                  <UIcon
                    name="i-heroicons-check-circle"
                    class="text-club-green mr-2 mt-0.5 flex-shrink-0"
                  />
                  <span>{{ include }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Services additionnels -->
        <div class="adaptive-card rounded-xl shadow-lg p-8 mb-12">
          <h3 class="text-2xl font-bold adaptive-title mb-6 text-center">
            Services Additionnels
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="service in data.pricing.additional"
              :key="service.service"
              class="text-center p-6 adaptive-bg rounded-lg"
            >
              <div
                class="w-16 h-16 bg-club-yellow rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <UIcon
                  name="i-heroicons-academic-cap"
                  class="text-club-navy text-2xl"
                />
              </div>
              <h4 class="font-bold adaptive-title mb-2">
                {{ service.service }}
              </h4>
              <div class="text-2xl font-bold text-club-green mb-1">
                {{ service.price }}€
              </div>
              <div class="text-sm adaptive-text mb-3">
                {{ service.unit }}
              </div>
              <p class="text-sm adaptive-text">
                {{ service.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Réductions -->
        <div class="reductions-section rounded-xl shadow-lg p-8">
          <h3 class="text-2xl font-bold mb-6 text-center reductions-title">
            Réductions Disponibles
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="reduction in data.pricing.reductions"
              :key="`${reduction.type}-${reduction.description}`"
              class="text-center p-4 rounded-lg reduction-card transition-colors"
            >
              <div
                class="w-16 h-16 bg-club-yellow rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="text-club-navy font-bold text-xl"
                  >{{ reduction.amount }}€</span
                >
              </div>
              <h4 class="font-bold text-club-yellow mb-2">
                {{ reduction.type }}
              </h4>
              <p class="text-sm reduction-text mb-3">
                {{ reduction.description }}
              </p>
              <p class="text-xs reduction-subtext mb-3">
                {{ reduction.condition }}
              </p>

              <a
                v-if="'url' in reduction && reduction.url"
                :href="reduction.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center text-xs bg-club-yellow text-club-navy px-3 py-1 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
              >
                <UIcon
                  name="i-heroicons-arrow-top-right-on-square"
                  class="mr-1 w-3 h-3"
                />
                Plus d'infos
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Informations pratiques -->
    <section class="py-16 page-section">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Inscription -->
        <div class="practical-info-card rounded-xl p-8">
          <h3 class="text-2xl font-bold adaptive-title mb-6 flex items-center">
            <UIcon
              name="i-heroicons-clipboard-document-list"
              class="mr-3 text-club-green"
            />
            Inscription
          </h3>

          <div class="space-y-6">
            <div>
              <h4 class="adaptive-subtitle mb-2">Période d'inscription</h4>
              <p class="adaptive-text-primary">
                {{ data.registration.period }}
              </p>
            </div>

            <div>
              <h4 class="adaptive-subtitle mb-3">Documents requis</h4>
              <div class="space-y-3">
                <div
                  v-for="document in data.registration.documents"
                  :key="document.name"
                  class="adaptive-card p-4 rounded-lg hover:border-club-green transition-colors"
                >
                  <div class="flex items-start">
                    <UIcon
                      :name="getDocumentIcon(document.type)"
                      class="text-club-green mr-3 mt-1 flex-shrink-0 w-5 h-5"
                    />
                    <div class="flex-1">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h5 class="font-medium adaptive-text-primary mb-1">
                            {{ document.name }}
                          </h5>
                          <p class="text-sm adaptive-text mb-2">
                            {{ document.description }}
                          </p>
                          <p
                            v-if="'condition' in document && document.condition"
                            class="text-sm text-orange-600 font-medium mb-2"
                          >
                            <UIcon
                              name="i-heroicons-exclamation-triangle"
                              class="w-4 h-4 mr-1 inline"
                            />
                            {{ document.condition }}
                          </p>

                          <!-- Download link -->
                          <a
                            v-if="'url' in document && document.url"
                            :href="document.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center text-sm bg-club-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-club-navy transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <UIcon
                              name="i-heroicons-arrow-down-tray"
                              class="w-4 h-4 mr-2"
                            />
                            Télécharger le document
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Note importante -->
              <div class="mt-4 p-3 info-note rounded-lg">
                <div class="flex items-start">
                  <UIcon
                    name="i-heroicons-information-circle"
                    class="text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                  />
                  <div class="text-sm info-note-text">
                    <strong>Important :</strong> Les documents FFTT sont mis à
                    jour automatiquement. Si un lien ne fonctionne pas,
                    consultez directement le
                    <a
                      href="https://www.fftt.com/doc/administratif/telechargement.html"
                      target="_blank"
                      class="underline hover:text-blue-600"
                    >
                      site officiel FFTT </a
                    >.
                  </div>
                </div>
              </div>
            </div>

            <div class="highlight-card rounded-lg p-4 border border-club-green">
              <h4 class="adaptive-subtitle mb-2">Contact Inscriptions</h4>
              <div class="space-y-1 text-sm">
                <div class="font-medium adaptive-text-primary">
                  {{ data.registration.contact.responsible }}
                </div>
                <div class="adaptive-text">
                  {{ data.registration.contact.role }}
                </div>
                <div class="flex items-center adaptive-text-primary">
                  <UIcon name="i-heroicons-envelope" class="mr-2" />
                  {{ data.registration.contact.email }}
                </div>
                <div class="flex items-center adaptive-text-primary">
                  <UIcon name="i-heroicons-phone" class="mr-2" />
                  {{ data.registration.contact.phone }}
                </div>
                <div class="adaptive-text italic">
                  {{ data.registration.contact.availability }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section CTA -->
    <section class="py-16 bg-club-green">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-white mb-4">
          Prêt à rejoindre notre club ?
        </h2>
        <p class="text-xl text-gray-100 mb-8">
          Contactez-nous pour plus d'informations ou pour planifier une séance
          d'essai gratuite !
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/contact"
            color="primary"
            size="lg"
            class="font-semibold"
          >
            <UIcon name="i-heroicons-phone" class="mr-2" />
            Nous contacter
          </UButton>
          <UButton
            to="/club"
            variant="outline"
            color="white"
            size="lg"
            class="font-semibold"
          >
            <UIcon name="i-heroicons-information-circle" class="mr-2" />
            En savoir plus sur le club
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Load club configuration for dynamic content
const { data: clubConfig } = await useFetch("/api/club/config");

// Configuration SEO with dynamic club name
useSeoMeta({
  title: "Horaires et Tarifs",
  description: `Découvrez les horaires d'entraînement et les tarifs du ${clubConfig.value?.club?.name || "Club Pongiste Libercourtois"}. Des créneaux adaptés à tous les âges et tous les niveaux.`,
  keywords:
    "horaires tennis de table, tarifs club, entraînement ping-pong, créneaux Libercourt, inscription club",
});

// Load schedule and pricing data
const data = await $fetch("/api/club/schedules-pricing");

// Function to get icon based on document type
function getDocumentIcon(type: string): string {
  const icons: Record<string, string> = {
    form: "i-heroicons-document-text",
    fftt: "i-heroicons-building-office",
    medical: "i-heroicons-heart",
    contact: "i-heroicons-at-symbol",
    payment: "i-heroicons-credit-card",
  };
  return icons[type] || "i-heroicons-document";
}
</script>
