import { getSponsors } from "~~/server/domains/club/service";

export default defineCachedEventHandler(
  async () => {
    const rows = await getSponsors();
    return {
      sponsors: rows.map((s) => ({
        id: s.id,
        name: s.name,
        logo: s.logo ?? "",
        website: s.website ?? undefined,
        description: s.description ?? undefined,
        category:
          (s.category as "sponsor" | "partenaire" | "institutionnel") ??
          "sponsor",
      })),
    };
  },
  { maxAge: 60 * 5, name: "sponsors", getKey: () => "all" },
);
