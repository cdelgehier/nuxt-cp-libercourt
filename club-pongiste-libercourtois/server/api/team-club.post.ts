import { SmartPingAPI } from "~/server/utils/smartping";

interface TeamData {
  idequipe: string;
  libequipe: string;
  libdivision: string;
  liendivision: string;
  idepr: string;
  libepr: string;
}

interface TeamClubRequest {
  team: TeamData;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<TeamClubRequest>(event);

    if (!body.team) {
      return {
        success: false,
        error: "Team data is required",
        source: "validation",
      };
    }

    console.log("Getting club details for team:", {
      teamName: body.team.libequipe,
      teamId: body.team.idequipe,
      division: body.team.libdivision,
    });

    const config = useRuntimeConfig();
    const smartPingApi = new SmartPingAPI(
      config.smartpingAppCode,
      config.smartpingPassword,
      config.smartpingEmail,
    );

    const result = await smartPingApi.getClubFromTeam(body.team);

    if (result.success && result.data) {
      // Build Google Maps URL from club address
      const address = [
        result.data.adresse,
        result.data.codepostal,
        result.data.ville,
      ]
        .filter(Boolean)
        .join(", ");

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

      // Calculate travel time if GPS coordinates are available
      let travelTimeMinutes: number | null = null;
      if (result.data.latitude && result.data.longitude) {
        const libercourt = { lat: 50.481854, lng: 3.017099 }; // Our club coordinates
        const clubLat = parseFloat(result.data.latitude);
        const clubLng = parseFloat(result.data.longitude);

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

      console.log("Club details found for team:", {
        teamName: body.team.libequipe,
        clubNumber: result.data.numero,
        clubName: result.data.nom,
        ville: result.data.ville,
        travelTime: travelTimeMinutes,
        source: result.source,
      });

      return {
        success: true,
        data: {
          ...result.data,
          googleMapsUrl,
          travelTimeMinutes,
          teamInfo: {
            teamId: body.team.idequipe,
            teamName: body.team.libequipe,
            division: body.team.libdivision,
          },
        },
        source: result.source,
      };
    } else {
      console.error("Failed to get club details for team:", {
        teamName: body.team.libequipe,
        error: result.error,
      });

      return {
        success: false,
        error:
          result.error ||
          `Could not find club details for team: ${body.team.libequipe}`,
        source: result.source || "unknown",
      };
    }
  } catch (error) {
    console.error("Team club API error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "api_error",
    };
  }
});
