import { SmartPingAPI } from "~/server/utils/smartping";

interface ClubDetailsRequest {
  opponentName: string;
}

function extractClubName(teamName: string): string {
  return teamName
    .replace(/\s+\d+$/g, "")
    .replace(/\s+(A|B|C|D)$/g, "")
    .replace(/\s+reçoit\s+à\s+\w+$/g, "")
    .trim();
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ClubDetailsRequest>(event);

    if (!body.opponentName) {
      return {
        success: false,
        error: "Opponent name is required",
        source: "validation",
      };
    }

    console.log("Processing opponent:", body.opponentName);

    const clubName = extractClubName(body.opponentName);
    console.log("Extracted club name:", clubName);

    const config = useRuntimeConfig();
    const smartPingApi = new SmartPingAPI(
      config.smartpingAppCode,
      config.smartpingPassword,
      config.smartpingEmail,
    );

    let clubDetails = null;
    let searchMethod = "none";

    // Search clubs by name using FFTT API
    console.log("Searching clubs by name:", clubName);
    const searchResult = await smartPingApi.searchClubs(undefined, clubName);

    if (
      searchResult.success &&
      searchResult.data &&
      searchResult.data.length > 0
    ) {
      const firstClub = searchResult.data[0];
      console.log("Found club by name search:", firstClub);

      const detailsResult = await smartPingApi.getClubDetails(firstClub.numero);

      if (detailsResult.success && detailsResult.data) {
        clubDetails = detailsResult.data;
        searchMethod = "name_search";
      }
    }

    if (clubDetails) {
      // Build Google Maps URL from address
      const address = [
        clubDetails.adresse,
        clubDetails.codepostal,
        clubDetails.ville,
      ]
        .filter(Boolean)
        .join(", ");

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

      // Calculate travel time if GPS coordinates are available
      let travelTimeMinutes: number | null = null;
      if (clubDetails.latitude && clubDetails.longitude) {
        const libercourt = { lat: 50.481854, lng: 3.017099 }; // Our club coordinates
        const clubLat = parseFloat(clubDetails.latitude);
        const clubLng = parseFloat(clubDetails.longitude);

        // Calculate distance using Haversine formula
        const lat1 = (libercourt.lat * Math.PI) / 180;
        const lat2 = (clubLat * Math.PI) / 180;
        const deltaLat = ((clubLat - libercourt.lat) * Math.PI) / 180;
        const deltaLon = ((clubLng - libercourt.lng) * Math.PI) / 180;

        const a =
          Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLon / 2) *
            Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = 6371 * c;

        // Estimate travel time: real distance = crow flies * 1.3, average speed = 50km/h
        const realDistanceKm = distanceKm * 1.3;
        travelTimeMinutes = Math.max(
          10,
          Math.round((realDistanceKm / 50) * 60),
        );
      }

      console.log("Club details found:", {
        clubNumber: clubDetails.numero,
        clubName: clubDetails.nom,
        ville: clubDetails.ville,
        travelTime: travelTimeMinutes,
        searchMethod,
      });

      return {
        success: true,
        data: {
          ...clubDetails,
          googleMapsUrl,
          travelTimeMinutes,
          searchMethod,
        },
        source: "smartping_club_search",
      };
    } else {
      return {
        success: false,
        error: `Could not find club details for opponent: ${body.opponentName}`,
        source: "club_not_found",
      };
    }
  } catch (error) {
    console.error("Club details API error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "api_error",
    };
  }
});
