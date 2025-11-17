import { z } from "zod";
import {
  SmartPingAPI,
  fetchTeamsWithSmartPing,
} from "~/server/utils/smartping";
import { getClubId } from "~/server/utils/clubConfig";

// Schema for club statistics
const ClubStatsSchema = z.object({
  licencies: z.number(),
  equipes: z.number(),
  annees: z.number(),
  lastUpdated: z.string(),
  debug: z
    .object({
      source: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
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

    // Get environment variables for FFTT authentication
    const appCode = process.env.SMARTPING_APP_CODE;
    const password = process.env.SMARTPING_PASSWORD;
    const email = process.env.SMARTPING_EMAIL;

    if (!appCode || !password || !email) {
      throw createError({
        statusCode: 500,
        statusMessage: "SmartPing credentials not configured",
      });
    }

    // Initialize SmartPing API with proper authentication
    const smartPing = new SmartPingAPI(appCode, password, email);

    // Get licensees list with complete information (same as /api/club/licensees)
    const licenseesData =
      await smartPing.getClubLicenseesWithCategories(clubId);

    if (!licenseesData.success || !licenseesData.data) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch licensees: ${licenseesData.error}`,
      });
    }

    // Filter licensees who belong to our club only AND have a valid license (same filter as /api/club/licensees)
    const validLicensees = licenseesData.data.filter((licensee: any) => {
      const belongsToOurClub =
        licensee.nclub === clubId ||
        licensee.nclub === clubId.replace(/^0+/, "");
      const hasValidLicense = licensee.valide && licensee.valide.trim() !== "";
      return belongsToOurClub && hasValidLicense;
    });

    const licencies = validLicensees.length;

    // Fetch teams data from SmartPing to get real team count
    const teamsData = await fetchTeamsWithSmartPing(clubId);
    const equipes =
      teamsData.success && teamsData.data ? teamsData.data.length : 0;

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
        source: "smartping",
        message: "Success",
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
      statusMessage: "Unable to fetch club statistics",
    });
  }
});
