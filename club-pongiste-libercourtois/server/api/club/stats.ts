import { z } from "zod";

// Schema for club statistics
const ClubStatsSchema = z.object({
  licencies: z.number(),
  equipes: z.number(),
  annees: z.number(),
  lastUpdated: z.string(),
});

type ClubStats = z.infer<typeof ClubStatsSchema>;

// Cache for club stats (simple in-memory cache)
let cachedStats: ClubStats | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

export default defineEventHandler(async (_event): Promise<ClubStats> => {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedStats && now - lastFetch < CACHE_DURATION) {
    return cachedStats;
  }

  try {
    // Fetch data from PingPocket website
    const response = await $fetch<string>(
      "https://www.pingpocket.fr/app/fftt/clubs/07620112",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Club-Libercourtois-Bot/1.0)",
        },
      },
    );

    // Extract number of licencies from HTML
    const licenciesMatch = response.match(/n° \d+ - (\d+) licenciés/);
    const licencies = licenciesMatch ? parseInt(licenciesMatch[1], 10) : 78;

    // Extract number of teams from HTML
    const equipesMatch = response.match(/Liste des équipes (\d+)/);
    const equipes = equipesMatch ? parseInt(equipesMatch[1], 10) : 9;

    // Calculate years since club foundation (1970)
    const currentYear = new Date().getFullYear();
    const annees = currentYear - 1970;

    // Create stats object
    const stats: ClubStats = {
      licencies,
      equipes,
      annees,
      lastUpdated: new Date().toISOString(),
    };

    // Validate data with Zod schema
    const validatedStats = ClubStatsSchema.parse(stats);

    // Update cache
    cachedStats = validatedStats;
    lastFetch = now;

    return validatedStats;
  } catch (error) {
    console.error("Error fetching club stats:", error);

    // Return fallback data if API fails
    const fallbackStats: ClubStats = {
      licencies: 78,
      equipes: 9,
      annees: new Date().getFullYear() - 1970,
      lastUpdated: new Date().toISOString(),
    };

    return fallbackStats;
  }
});
