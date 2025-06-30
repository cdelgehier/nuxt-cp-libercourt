<template>
  <div>
    <!-- Success Hero Section -->
    <section
      class="bg-gradient-to-r from-club-green to-club-navy py-16 lg:py-24"
    >
      <div
        class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
      >
        <div
          class="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <UIcon
            name="i-heroicons-check-circle"
            class="text-4xl text-club-green"
          />
        </div>

        <h1 class="text-4xl font-bold mb-6">Message envoyé avec succès !</h1>

        <p class="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
          Merci pour votre message. Notre équipe vous répondra dans les plus
          brefs délais.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/"
            size="xl"
            color="white"
            variant="solid"
            class="font-semibold"
          >
            <UIcon name="i-heroicons-home" class="mr-2" />
            Retour à l'accueil
          </UButton>

          <UButton
            to="/contact"
            size="xl"
            color="white"
            variant="outline"
            class="font-semibold"
          >
            <UIcon name="i-heroicons-arrow-left" class="mr-2" />
            Retour au contact
          </UButton>
        </div>
      </div>
    </section>

    <!-- Next steps -->
    <section class="py-16 page-section">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold adaptive-title mb-4">
            Et maintenant ?
          </h2>
          <p class="text-lg adaptive-text">
            En attendant notre réponse, découvrez-en plus sur notre club
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            class="adaptive-card rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div
              class="w-16 h-16 bg-club-navy rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UIcon
                name="i-heroicons-building-office"
                class="text-2xl text-club-yellow"
              />
            </div>
            <h3 class="text-xl font-bold adaptive-title mb-3">
              Découvrir le club
            </h3>
            <p class="adaptive-text mb-4">
              Apprenez-en plus sur notre histoire, nos valeurs et notre équipe
            </p>
            <UButton
              to="/club"
              variant="outline"
              color="primary"
              size="sm"
              class="font-semibold"
            >
              En savoir plus
            </UButton>
          </div>

          <div
            class="adaptive-card rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div
              class="w-16 h-16 bg-club-green rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UIcon
                name="i-heroicons-currency-euro"
                class="text-2xl text-white"
              />
            </div>
            <h3 class="text-xl font-bold adaptive-title mb-3">Nos tarifs</h3>
            <p class="adaptive-text mb-4">
              Consultez nos tarifs et horaires pour choisir la formule qui vous
              convient
            </p>
            <UButton
              to="/horaires-tarifs"
              variant="outline"
              color="primary"
              size="sm"
              class="font-semibold"
            >
              Voir les tarifs
            </UButton>
          </div>

          <div
            class="adaptive-card rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div
              class="w-16 h-16 bg-club-yellow rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UIcon
                name="i-heroicons-calendar-days"
                class="text-2xl text-club-navy"
              />
            </div>
            <h3 class="text-xl font-bold adaptive-title mb-3">Calendrier</h3>
            <p class="adaptive-text mb-4">
              Découvrez nos prochains événements et compétitions
            </p>
            <UButton
              to="/calendrier"
              variant="outline"
              color="primary"
              size="sm"
              class="font-semibold"
            >
              Voir le calendrier
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact info reminder -->
    <section class="py-16 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-2xl font-bold adaptive-title mb-6">
          Besoin d'une réponse immédiate ?
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div class="adaptive-card rounded-lg p-6">
            <UIcon
              name="i-heroicons-phone"
              class="text-2xl text-club-green mx-auto mb-3"
            />
            <h3 class="font-bold adaptive-title mb-2">Appelez-nous</h3>
            <a
              href="tel:0327851234"
              class="text-club-green hover:underline font-medium"
            >
              03 27 85 12 34
            </a>
          </div>

          <div class="adaptive-card rounded-lg p-6">
            <UIcon
              name="i-heroicons-envelope"
              class="text-2xl text-club-green mx-auto mb-3"
            />
            <h3 class="font-bold adaptive-title mb-2">Écrivez-nous</h3>
            <a
              href="mailto:contact@club-libercourtois.fr"
              class="text-club-green hover:underline font-medium"
            >
              contact@club-libercourtois.fr
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Load club configuration for dynamic content
const { data: clubConfig } = await useFetch("/api/club/config");

// SEO configuration
useSeoMeta({
  title: "Merci pour votre message",
  description: `Merci d'avoir contacté le ${clubConfig.value?.club?.name || "Club Pongiste Libercourtois"}. Nous vous répondrons rapidement.`,
  robots: "noindex, nofollow", // Don't index thank you pages
});
</script>
