<template>
  <section class="py-16 bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-club-navy mb-4">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-lg text-gray-600">
          {{ subtitle }}
        </p>
      </div>

      <!-- Popular questions or specific category -->
      <div class="space-y-4 mb-8">
        <UAccordion :items="displayedFaqItems" :ui="{ wrapper: 'space-y-3' }" />
      </div>

      <!-- Link to complete FAQ page -->
      <div class="text-center">
        <NuxtLink
          to="/faq"
          class="inline-flex items-center px-6 py-3 bg-club-blue text-white rounded-lg font-semibold hover:bg-club-navy transition-colors"
        >
          <Icon name="i-heroicons-question-mark-circle" class="w-5 h-5 mr-2" />
          Voir toutes les questions
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  subtitle?: string;
  category?: string; // Specific category ou 'popular' pour les questions populaires
  limit?: number; // Maximum number of questions to display
}

const props = withDefaults(defineProps<Props>(), {
  title: "Questions Fréquentes",
  subtitle: "Retrouvez les réponses aux questions les plus courantes",
  category: "popular",
  limit: 5,
});

// Utilisation du composable FAQ
const {
  faqData,
  fetchFaqData,
  getPopularQuestions,
  getQuestionsByCategory,
  formatForAccordion,
} = useClubFaq();

// Load data if not already done
if (!faqData.value) {
  await fetchFaqData();
}

// Questions to display based on props
const questionsToShow = computed(() => {
  if (!faqData.value) return [];

  let questions;

  if (props.category === "popular") {
    questions = getPopularQuestions.value;
  } else {
    questions = getQuestionsByCategory(props.category);
  }

  // Limiter le nombre de questions
  return questions.slice(0, props.limit);
});

// Items formatted for accordion
const displayedFaqItems = computed(() => {
  return formatForAccordion(questionsToShow.value);
});
</script>
