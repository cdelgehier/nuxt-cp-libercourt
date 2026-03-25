interface FaqQuestion {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

interface FaqCategory {
  id: string;
  name: string;
  icon: string;
  questions: FaqQuestion[];
}

interface FaqData {
  categories: FaqCategory[];
  popular: string[];
  stats: {
    totalQuestions: number;
    totalCategories: number;
    lastUpdated: string;
  };
}

export const useClubFaq = () => {
  const faqData = ref<FaqData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Load FAQ data
  const fetchFaqData = async () => {
    try {
      loading.value = true;
      error.value = null;

      const data = await $fetch<FaqData>("/api/club/faq");
      faqData.value = data;

      return data;
    } catch (err) {
      error.value = "Erreur lors du chargement des FAQ";
      console.error("Erreur FAQ:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Obtenir toutes les questions dans un format plat
  const getAllQuestions = computed(() => {
    if (!faqData.value) return [];

    return faqData.value.categories.flatMap((category) =>
      category.questions.map((question) => ({
        ...question,
        categoryId: category.id,
        categoryName: category.name,
      })),
    );
  });

  // Obtenir les questions populaires
  const getPopularQuestions = computed(() => {
    if (!faqData.value) return [];

    const allQuestions = getAllQuestions.value;
    return faqData.value.popular
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter(Boolean) as (FaqQuestion & {
      categoryId: string;
      categoryName: string;
    })[];
  });

  // Rechercher dans les FAQ
  const searchQuestions = (
    searchTerm: string,
  ): (FaqQuestion & { categoryId: string; categoryName: string })[] => {
    if (!faqData.value || !searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    return getAllQuestions.value.filter(
      (question) =>
        question.question.toLowerCase().includes(term) ||
        question.answer.toLowerCase().includes(term) ||
        question.tags.some((tag) => tag.toLowerCase().includes(term)),
    );
  };

  // Get questions by category
  const getQuestionsByCategory = (categoryId: string): FaqQuestion[] => {
    if (!faqData.value) return [];

    const category = faqData.value.categories.find(
      (cat) => cat.id === categoryId,
    );
    return category?.questions || [];
  };

  // Get a specific question
  const getQuestionById = (
    questionId: string,
  ): (FaqQuestion & { categoryId: string; categoryName: string }) | null => {
    return getAllQuestions.value.find((q) => q.id === questionId) || null;
  };

  // Format for Nuxt UI accordion
  const formatForAccordion = (
    questions: FaqQuestion[],
  ): Array<{ label: string; content: string; defaultOpen: boolean }> => {
    return questions.map((question) => ({
      label: question.question,
      content: question.answer,
      defaultOpen: false,
    }));
  };

  return {
    // State
    faqData: readonly(faqData),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchFaqData,

    // Getters
    getAllQuestions,
    getPopularQuestions,
    searchQuestions,
    getQuestionsByCategory,
    getQuestionById,
    formatForAccordion,
  };
};
