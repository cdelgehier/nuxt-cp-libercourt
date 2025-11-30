<template>
  <!-- Hero section with club presentation and call-to-action buttons -->
  <section class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center text-white">
        <h1 class="text-4xl lg:text-5xl font-bold text-white mb-4">
          Club Pongiste
          <span class="text-club-yellow">Libercourtois</span>
        </h1>
        <p class="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
          Rejoignez notre communauté passionnée de tennis de table depuis 1970.
          Club convivial ouvert à tous les âges et tous les niveaux.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/contact"
            color="primary"
            size="lg"
            class="font-semibold bg-club-yellow text-club-navy hover:bg-yellow-400"
          >
            <UIcon name="i-heroicons-user-plus" class="mr-2" />
            Nous rejoindre
          </UButton>
          <UButton
            to="/club"
            variant="outline"
            color="white"
            size="lg"
            class="font-semibold border-white text-white hover:bg-white hover:text-club-navy"
          >
            <UIcon name="i-heroicons-information-circle" class="mr-2" />
            Découvrir le club
          </UButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Hero section component - no props or logic needed
</script>
