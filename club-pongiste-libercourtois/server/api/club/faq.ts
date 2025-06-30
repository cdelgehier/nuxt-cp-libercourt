import type { ClubConfig } from "~/types";

export default defineEventHandler(async (_event) => {
  try {
    // Import centralized configuration data
    const configData = await import("~/content/club/config.json");
    const config = (configData.default || configData) as ClubConfig;

    // Import FAQ data from JSON file
    const faqFileData = await import("~/content/club/faq.json");
    const faqData = faqFileData.default || faqFileData;

    // Calculate dynamic stats from actual data
    const totalCategories = faqData.categories.length;
    const totalQuestions = faqData.categories.reduce(
      (sum: number, category: any) => sum + category.questions.length,
      0,
    );

    // Enrich FAQ data with config information
    const enrichedFaqData = {
      ...faqData,
      categories: faqData.categories.map((category: any) => ({
        ...category,
        questions: category.questions.map((question: any) => {
          let enrichedAnswer = question.answer;

          // Enrich specific answers with config data
          if (question.id === "comment-inscrire") {
            enrichedAnswer = `Vous pouvez vous inscrire en contactant notre club par email à ${config.club.email} ou par téléphone au ${config.club.phone}. Vous pouvez également vous rendre aux permanences du mardi et jeudi de 18h à 20h à la ${config.club.salle}.`;
          } else if (question.id === "localisation") {
            enrichedAnswer = `Nous jouons à la ${config.club.salle}, dans le ${config.club.complexe} à ${config.location.city} (${config.location.postalCode}). Parking gratuit sur place et PMR.`;
          }

          return {
            ...question,
            answer: enrichedAnswer,
          };
        }),
      })),
      // Replace static stats with calculated ones
      stats: {
        totalQuestions,
        totalCategories,
        lastUpdated: new Date().toISOString(),
      },
    };

    return enrichedFaqData;
  } catch (_error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors du chargement des FAQ",
    });
  }
});
