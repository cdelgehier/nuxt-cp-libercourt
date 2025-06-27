<template>
  <div class="min-h-screen page-section">
    <!-- Intermediate Hero Section -->
    <section
      class="bg-gradient-to-r from-club-navy to-club-green py-12 lg:py-16"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-white">
          <h1 class="text-3xl font-bold text-white sm:text-4xl mb-4">
            Questions
            <span class="text-club-yellow">Fréquentes</span>
          </h1>
          <p class="text-xl text-gray-200 max-w-3xl mx-auto">
            Trouvez rapidement les réponses aux questions les plus courantes sur
            notre club
          </p>
        </div>
      </div>
    </section>

    <!-- Barre de recherche -->
    <section class="py-8 page-section">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="relative">
          <Icon
            name="i-heroicons-magnifying-glass"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Rechercher une question..."
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-club-blue focus:border-transparent"
          />
        </div>
      </div>
    </section>

    <!-- Stats rapides -->
    <section class="py-8 bg-gray-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="adaptive-card rounded-lg shadow-sm p-6 text-center">
            <div class="text-2xl font-bold text-club-blue mb-2">
              {{ faqData?.stats.totalQuestions || 0 }}
            </div>
            <div class="adaptive-text">Questions répondues</div>
          </div>
          <div class="adaptive-card rounded-lg shadow-sm p-6 text-center">
            <div class="text-2xl font-bold text-club-blue mb-2">2</div>
            <div class="adaptive-text">Essais gratuits</div>
          </div>
          <div class="adaptive-card rounded-lg shadow-sm p-6 text-center">
            <div class="text-2xl font-bold text-club-blue mb-2">45€</div>
            <div class="adaptive-text">À partir de</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Questions by category -->
    <section class="py-16">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Category filters -->
        <div class="mb-12">
          <div class="flex flex-wrap justify-center gap-4 mb-8">
            <button
              v-for="category in allCategories"
              :key="category.key"
              :class="[
                'px-6 py-2 rounded-full border transition-all duration-200',
                selectedCategory === category.key
                  ? 'bg-club-blue text-white border-club-blue'
                  : 'adaptive-card text-gray-700 border-gray-300 hover:border-club-blue hover:text-club-blue',
              ]"
              @click="selectedCategory = category.key"
            >
              <Icon :name="category.icon" class="w-4 h-4 mr-2" />
              {{ category.label }}
            </button>
          </div>
        </div>

        <!-- Search results or FAQ by category -->
        <div class="space-y-4">
          <div
            v-if="searchTerm && searchResults.length === 0"
            class="text-center py-8 text-gray-500"
          >
            Aucune question trouvée pour "{{ searchTerm }}"
          </div>

          <UAccordion
            v-else
            :items="displayedFaqItems"
            :ui="{ wrapper: 'space-y-3' }"
          />
        </div>

        <!-- Contact pour autres questions -->
        <div class="mt-16 bg-club-blue rounded-xl p-8 text-center text-white">
          <h3 class="text-2xl font-bold mb-4">
            Vous ne trouvez pas votre réponse ?
          </h3>
          <p class="text-blue-100 mb-6">
            Notre équipe est là pour vous aider ! Contactez-nous directement.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/contact"
              class="inline-flex items-center justify-center px-6 py-3 adaptive-card text-club-blue rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Icon name="i-heroicons-envelope" class="w-5 h-5 mr-2" />
              Nous contacter
            </NuxtLink>
            <a
              :href="`tel:${contactData.club.phone}`"
              class="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:adaptive-card hover:text-club-blue transition-colors"
            >
              <Icon name="i-heroicons-phone" class="w-5 h-5 mr-2" />
              {{ contactData.club.phone }}
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Configuration SEO
useSeoMeta({
  title: "FAQ - Questions Fréquentes",
  description:
    "Trouvez les réponses aux questions les plus courantes sur le Club Pongiste Libercourtois : inscriptions, tarifs, horaires, matériel et compétitions.",
  keywords:
    "FAQ tennis de table, questions fréquentes, inscriptions club, tarifs ping pong, horaires entrainement, Libercourt",
});

// Utilisation du composable FAQ
const {
  faqData,
  loading,
  error,
  fetchFaqData,
  getAllQuestions,
  searchQuestions,
  getQuestionsByCategory,
  formatForAccordion,
} = useClubFaq();

// Load FAQ data
await fetchFaqData();

// Load contact data for phone number
const contactData = await $fetch("/api/club/contact");

// Local state
const searchTerm = ref("");
const selectedCategory = ref("all");

// Categories for filters
const allCategories = computed(() => {
  if (!faqData.value) return [];

  return [
    { key: "all", label: "Toutes", icon: "i-heroicons-squares-2x2" },
    ...faqData.value.categories.map((cat) => ({
      key: cat.id,
      label: cat.name,
      icon: cat.icon,
    })),
  ];
});

// Search results
const searchResults = computed(() => {
  if (!searchTerm.value.trim()) return [];
  return searchQuestions(searchTerm.value);
});

// Filtered questions by selected category
const filteredByCategory = computed(() => {
  if (!faqData.value) return [];

  if (selectedCategory.value === "all") {
    return getAllQuestions.value;
  }

  return getQuestionsByCategory(selectedCategory.value);
});

// Questions to display (search or category filter)
const displayedQuestions = computed(() => {
  if (searchTerm.value.trim()) {
    return searchResults.value;
  }

  return filteredByCategory.value;
});

// Items formatted for accordion
const displayedFaqItems = computed(() => {
  return formatForAccordion(displayedQuestions.value);
});

// Watcher to reset category when searching
watch(searchTerm, (newTerm) => {
  if (newTerm.trim() && selectedCategory.value !== "all") {
    selectedCategory.value = "all";
  }
});
</script>

<style scoped>
/* Custom styles for icons and animations */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
