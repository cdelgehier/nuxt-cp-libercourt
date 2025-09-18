import { fetchTeamsWithSmartPing } from "~/server/utils/smartping";
import clubConfig from "~/content/club/config.json";

export default defineEventHandler(async (event) => {
  try {
    const clubId = clubConfig.club.id; // "07620112"

    console.log("Fetching teams for club:", clubId);

    const result = await fetchTeamsWithSmartPing(clubId);

    if (result.success) {
      console.log("Teams fetched successfully:", {
        count: result.data?.length || 0,
        source: result.source,
      });

      return {
        success: true,
        data: result.data || [],
        source: result.source,
      };
    } else {
      console.error("Failed to fetch teams:", result.error);

      return {
        success: false,
        error: result.error,
        source: result.source,
      };
    }
  } catch (error) {
    console.error("Teams API error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "api_error",
    };
  }
});
