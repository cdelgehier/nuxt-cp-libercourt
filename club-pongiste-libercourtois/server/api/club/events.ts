export default defineEventHandler(async (_event) => {
  try {
    // Import club configuration for location data
    const configData = await import("~/content/club/config.json");
    const config = configData.default || configData;

    // Import events from centralized JSON file
    const eventsData = await import("~/content/events/events.json");
    const eventsJson = eventsData.default || eventsData;

    // Event categories configuration
    const categories = [
      {
        id: "entrainement",
        label: "Entraînements",
        description: "Séances d'entraînement régulières",
        color: "#20B2AA",
      },
      {
        id: "competition",
        label: "Compétitions",
        description: "Matchs et tournois officiels",
        color: "#DC143C",
      },
      {
        id: "stage",
        label: "Stages",
        description: "Stages de perfectionnement",
        color: "#FFD700",
      },
      {
        id: "evenement",
        label: "Événements",
        description: "Événements spéciaux du club",
        color: "#1e293b",
      },
    ];

    // Transform events with location fallback
    const transformedEvents = eventsJson.events.map((evt: any) => ({
      ...evt,
      // Use event location if provided, otherwise use club default location
      location:
        evt.location ||
        config.location?.name ||
        "Salle Deladerriere - Complexe Sportif Léo Lagrange",
    }));

    return {
      categories,
      events: transformedEvents,
    };
  } catch (_error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors du chargement des événements",
    });
  }
});
