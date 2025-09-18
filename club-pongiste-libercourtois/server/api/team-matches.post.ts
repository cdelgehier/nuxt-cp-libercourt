import { fetchTeamMatchesWithSmartPing } from "~/server/utils/smartping";

interface TeamData {
  idequipe: string;
  libequipe: string;
  libdivision: string;
  liendivision: string;
  idepr: string;
  libepr: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ team: TeamData }>(event);

    if (!body.team) {
      return {
        success: false,
        error: "Team data is required",
        source: "validation",
      };
    }

    console.log("Fetching matches for team:", {
      name: body.team.libequipe,
      division: body.team.libdivision,
    });

    const result = await fetchTeamMatchesWithSmartPing(body.team, "LIBERCOURT");

    if (result.success) {
      console.log("Team matches fetched successfully:", {
        teamName: body.team.libequipe,
        matchCount: result.data?.length || 0,
        source: result.source,
      });

      return {
        success: true,
        data: result.data || [],
        source: result.source,
      };
    } else {
      console.error("Failed to fetch team matches:", {
        teamName: body.team.libequipe,
        error: result.error,
      });

      return {
        success: false,
        error: result.error,
        source: result.source,
      };
    }
  } catch (error) {
    console.error("Team matches API error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "api_error",
    };
  }
});
