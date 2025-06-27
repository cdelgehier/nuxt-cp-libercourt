export default defineEventHandler(async (event) => {
  try {
    // Import team data from JSON file
    const teamData = await import("~/content/club/team.json");

    // Get query parameter for format
    const query = getQuery(event);
    const format = query.format as string;

    const team = teamData.default?.team || teamData.team || [];

    if (format === "contacts") {
      // Format for contact page - with responsibilities
      return {
        contacts: team.map((member) => ({
          name: `${member.firstName} ${member.lastName}`,
          role: member.fullRole,
          responsibilities: member.responsibilities,
          email: member.email,
          phone: member.phone,
        })),
      };
    }

    // Default format for club page - with complete bio
    return {
      team: team.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        fullRole: member.fullRole,
        bio: member.bio,
        joinedDate: member.joinedDate ? new Date(member.joinedDate) : null,
        image: member.image,
      })),
    };
  } catch (error) {
    console.error("Erreur lors du chargement de l'équipe:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors du chargement des informations de l'équipe",
    });
  }
});
