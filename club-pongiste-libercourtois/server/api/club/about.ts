export default defineEventHandler(async (_event) => {
  try {
    // Import data du club depuis le fichier JSON
    const clubData = await import("~/content/club/about.json");

    return clubData.default || clubData;
  } catch (_error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors du chargement des informations du club",
    });
  }
});
