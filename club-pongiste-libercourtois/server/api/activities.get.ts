import { getActivities } from "~~/server/domains/club/service";

export default defineCachedEventHandler(
  async () => {
    const rows = await getActivities();
    return {
      activities: rows.map((a) => ({
        title: a.title,
        description: a.description ?? "",
        icon: a.icon ?? "i-heroicons-trophy",
        ageGroup: a.ageGroup ?? "",
      })),
    };
  },
  { maxAge: 60 * 5, name: "activities", getKey: () => "all" },
);
