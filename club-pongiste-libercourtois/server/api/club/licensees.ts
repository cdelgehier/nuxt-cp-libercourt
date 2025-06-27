import type { Licensee, ClubConfig } from "~/types";
import { fetchLicenseesWithSmartPing } from "~/server/utils/smartping";

// TODO: To integrate the real SmartPing FFTT API
// 1. Get an official SmartPing API key from FFTT
// 2. Set SMARTPING_API_KEY in environment variables
// 3. The system will automatically use the official API
// 4. Automatic fallback to PingPocket HTML then test data
//
// Documentation API SmartPing :
// https://www.fftt.com/site/medias/shares_files/informatique-specifications-techniques-api-smartping-720.pdf

export default defineEventHandler(async (event) => {
  try {
    // Load club configuration
    const configData = await import("~/content/club/config.json");
    const config = (configData.default || configData) as ClubConfig;
    const clubId = config.club.id;

    if (!clubId) {
      throw new Error("Club ID not found in configuration");
    }

    // Use the new SmartPing integration
    const result = await fetchLicenseesWithSmartPing(clubId);

    if (result.success) {
      // Filter only active licensees and sort
      const activeLicensees = result.licensees.filter(
        (licensee) => licensee.active,
      );
      activeLicensees.sort((a, b) => {
        if (a.lastName !== b.lastName) {
          return a.lastName.localeCompare(b.lastName);
        }
        return a.firstName.localeCompare(b.firstName);
      });

      return {
        success: true,
        licensees: activeLicensees,
        count: activeLicensees.length,
        source: result.source,
        clubId,
        message: result.message,
      };
    } else {
      return {
        success: false,
        message: result.message,
        licensees: [],
        count: 0,
        source: "error",
        clubId,
      };
    }
  } catch (error) {
    console.error("Error fetching licensees:", error);

    return {
      success: false,
      message: "Erreur lors de la récupération des licenciés",
      licensees: [],
      count: 0,
      source: "error",
    };
  }
});
