/**
 * GET /api/club/team
 * Liste des membres du bureau depuis la DB.
 */
import { getTeamMembers } from "~~/server/domains/club/service";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const members = await getTeamMembers();

  if (query.format === "contacts") {
    return {
      contacts: members.map((m) => ({
        name: `${m.firstName} ${m.lastName}`,
        role: m.fullRole ?? m.role,
        responsibilities: m.responsibilities,
        email: m.email,
        phone: m.phone,
      })),
    };
  }

  return {
    team: members.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      role: m.role,
      fullRole: m.fullRole,
      bio: m.bio,
      joinedDate: m.joinedDate,
      image: m.image,
    })),
  };
});
