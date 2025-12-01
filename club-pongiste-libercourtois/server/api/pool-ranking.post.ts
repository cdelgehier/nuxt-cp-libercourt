import {
  fetchPoolRankingWithSmartPing,
  type PoolRankingEntry,
} from "~/server/utils/smartping";

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
    const body = await readBody<{ team: TeamData; clubNumber: string }>(event);

    if (!body.team) {
      return {
        success: false,
        error: "Team data is required",
      };
    }

    if (!body.clubNumber) {
      return {
        success: false,
        error: "Club number is required",
      };
    }

    console.log("Fetching pool ranking:", {
      teamName: body.team.libequipe,
      division: body.team.libdivision,
      clubNumber: body.clubNumber,
    });

    // Use the SmartPing utility function to fetch pool ranking
    const result = await fetchPoolRankingWithSmartPing(
      body.team,
      body.clubNumber,
    );

    if (result.success && result.data) {
      console.log("Pool ranking fetched successfully:", {
        teamName: body.team.libequipe,
        rankingCount: result.data.length,
        clubTeamPosition:
          result.data.find((r: PoolRankingEntry) => r.isClubTeam)?.position ||
          "not found",
      });

      return {
        success: true,
        data: result.data,
        poolName: body.team.libdivision,
      };
    } else {
      console.error("Failed to fetch pool ranking:", {
        teamName: body.team.libequipe,
        error: result.error,
      });

      return {
        success: false,
        error: result.error || "Failed to fetch pool ranking",
      };
    }
  } catch (error) {
    console.error("Pool ranking API error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
