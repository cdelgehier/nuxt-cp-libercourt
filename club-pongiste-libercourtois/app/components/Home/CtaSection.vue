<template>
  <!-- Call-to-action section inviting visitors to join the club -->
  <section class="py-16 bg-club-navy">
    <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
      <h2 class="text-4xl font-bold text-white mb-4">
        Prêt à nous rejoindre ?
      </h2>
      <p class="text-xl text-gray-300 mb-8">
        Découvrez le plaisir du tennis de table dans une ambiance conviviale et
        sportive.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <UButton to="/contact" color="primary" size="lg" class="font-semibold">
          <UIcon name="i-heroicons-phone" class="mr-2" />
          Nous contacter
        </UButton>
        <UButton
          to="/horaires-tarifs"
          variant="solid"
          color="white"
          size="lg"
          class="font-semibold bg-white text-club-navy hover:bg-gray-100 dark:bg-gray-100 dark:text-club-navy dark:hover:bg-gray-200"
        >
          <UIcon name="i-heroicons-clock" class="mr-2" />
          Voir les horaires
        </UButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// CTA section component - no props or logic needed
</script>
