import { z } from "zod";
import { fetchLicenseesWithSmartPing } from "~/server/utils/smartping";
import { getClubId } from "~/server/utils/clubConfig";

// Schema for club statistics
const ClubStatsSchema = z.object({
  licencies: z.number(),
  equipes: z.number(),
  annees: z.number(),
  lastUpdated: z.string(),
  debug: z.object({
    source: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
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
    // Fetch real data from SmartPing API
    // Get club ID from configuration
    const clubId = getClubId();
    const licenseesData = await fetchLicenseesWithSmartPing(clubId);

    if (!licenseesData.success || !licenseesData.data) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch licensees: ${licenseesData.error}`
      });
    }

    const licencies = licenseesData.data.length;

    // Default number of teams (could be fetched from another API in the future)
    let equipes = 0;
    // Calculate years since club foundation (1970)
    const currentYear = new Date().getFullYear();
    const annees = currentYear - 1970;

    // Create stats object
    const stats: ClubStats = {
      licencies,
      equipes,
      annees,
      lastUpdated: new Date().toISOString(),
      debug: {
        source: licenseesData.source,
        message: licenseesData.error || 'Success',
      },
    };

    // Validate data with Zod schema
    const validatedStats = ClubStatsSchema.parse(stats);

    // Update cache
    cachedStats = validatedStats;
    lastFetch = now;

    return validatedStats;
  } catch (error) {
    console.error("Error fetching club stats:", error);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to fetch club statistics"
    });
  }
});
