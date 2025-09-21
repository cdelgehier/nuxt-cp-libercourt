import { fetchMatchDetailsWithSmartPing } from "~/server/utils/smartping";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ lien: string }>(event);

    if (!body.lien) {
      return {
        success: false,
        error: "Match lien parameter is required",
        source: "validation",
      };
    }

    console.log("Fetching match details with lien:", body.lien);

    const result = await fetchMatchDetailsWithSmartPing(body.lien);

    if (result.success) {
      console.log("Match details fetched successfully:", {
        hasData: !!result.data,
        partiesCount: result.data?.parties?.length || 0,
        source: result.source,
      });

      return {
        success: true,
        data: result.data || null,
        source: result.source,
      };
    } else {
      console.error("Failed to fetch match details:", {
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
    console.error("Match details API error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "api_error",
    };
  }
});
