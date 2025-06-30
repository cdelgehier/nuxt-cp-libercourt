export default defineEventHandler(async (_event) => {
  try {
    // Import team data from JSON file
    const teamData = await import("~/content/club/team.json");
    // Import centralized club configuration
    const configData = await import("~/content/club/config.json");

    const team = teamData.default?.team || teamData.team || [];
    const config = configData.default || configData;

    // Format for contact page - with responsibilities
    const contacts = team.map((member) => ({
      name: `${member.firstName} ${member.lastName}`,
      role: member.fullRole,
      responsibilities: member.responsibilities,
      email: member.email,
      phone: member.phone,
    }));

    // Complete data for contact page
    return {
      contacts,
      club: config.club,
      address: config.location,
      socialMedia: [config.social.facebook],
      schedule: {
        availability: {
          title: "Disponibilité des Responsables",
          note: "Nous sommes disponibles lors des créneaux d'entraînement et sur rendez-vous",
          sessions: [
            {
              day: "Contactez-nous",
              time: "Par email ou téléphone",
              location: "Réponse rapide garantie",
              contact: "Équipe dirigeante",
            },
          ],
        },
        training: {
          note: "Pendant les créneaux d'entraînement, un responsable est toujours présent pour vous accueillir.",
        },
      },
      faq: [
        {
          question: "Comment puis-je m'inscrire au club ?",
          answer:
            "Vous pouvez vous inscrire directement en venant aux permanences ou en nous contactant par téléphone. Nous vous expliquerons les démarches et les documents nécessaires.",
        },
        {
          question: "Quels sont les tarifs d'adhésion ?",
          answer:
            "Nos tarifs varient selon l'âge et le type de licence. Consultez notre page tarifs ou contactez-nous pour plus d'informations détaillées.",
        },
        {
          question: "Puis-je venir essayer avant de m'inscrire ?",
          answer:
            "Bien sûr ! Nous proposons des séances d'essai gratuites. Venez aux créneaux d'entraînement avec une tenue de sport, nous vous prêterons le matériel.",
        },
        {
          question: "Le club prête-t-il du matériel ?",
          answer:
            "Oui, nous avons des raquettes et balles disponibles pour les débutants et les séances d'essai. Pour une pratique régulière, nous conseillons l'achat de son propre matériel.",
        },
      ],
    };
  } catch (error) {
    console.error("Erreur lors du chargement des contacts:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors du chargement des informations de contact",
    });
  }
});
