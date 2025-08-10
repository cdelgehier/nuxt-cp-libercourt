import { fetchTeamsWithSmartPing } from "../../utils/smartping";
import { getClubId } from "../../utils/clubConfig";

/**
 * API endpoint to get club teams from SmartPing
 */
export default defineEventHandler(async (_event) => {
  try {
    // Get club ID from configuration
    const clubId = getClubId();

    // Fetch teams data from SmartPing
    const result = await fetchTeamsWithSmartPing(clubId);

    if (result.success && result.data) {
      return {
        success: true,
        teams: result.data,
        count: result.data.length,
        source: result.source || "smartping",
        clubId,
        lastUpdated: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        teams: [],
        count: 0,
        source: result.source || "error",
        error: result.error || 'Failed to fetch teams data',
        clubId
      };
    }

  } catch (error) {
    console.error('Error in teams API endpoint:', error);

    return {
      success: false,
      teams: [],
      count: 0,
      source: "error",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});
