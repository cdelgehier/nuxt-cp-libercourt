import { fetchPlayerMatchesWithSmartPing } from "~/server/utils/smartping";

export default defineEventHandler(async (event) => {
  try {
    const licence = getRouterParam(event, "licence");

    if (!licence) {
      return {
        success: false,
        error: "Licence parameter is required",
        source: "validation",
      };
    }

    console.log("Fetching player matches for licence:", licence);

    const result = await fetchPlayerMatchesWithSmartPing(licence);

    if (result.success) {
      console.log("Player matches fetched successfully:", {
        hasData: !!result.data,
        matchesCount: result.data?.length || 0,
        source: result.source,
      });

      return {
        success: true,
        data: result.data || [],
        source: result.source,
      };
    } else {
      console.error("Failed to fetch player matches:", {
        error: result.error,
        source: result.source,
      });

      return {
        success: false,
        error: result.error,
        source: result.source,
      };
    }
  } catch (error) {
    console.error("Player matches API error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "api_error",
    };
  }
});
