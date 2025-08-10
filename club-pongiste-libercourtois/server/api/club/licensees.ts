// Types for converted licensee data
interface LicenseeData {
  id: string;
  licence: string;
  firstName: string;
  lastName: string;
  club: string;
  clubName: string;
  points: number;
  ranking: string;
  level: string;
  position: number;
  nationality: string;
  gender: string;
  type: string;
  certificate: string;
  active: boolean;
  mixedLevel: string;
}

import { SmartPingAPI } from "../../utils/smartping";
import { getClubId } from "../../utils/clubConfig";

// SmartPing API integration for getting club player list
export default defineEventHandler(async (_event) => {
  try {
    // Get club ID from configuration
    const clubId = getClubId();

    // Get environment variables for FFTT authentication
    const appCode = process.env.SMARTPING_APP_CODE;
    const password = process.env.SMARTPING_PASSWORD;
    const email = process.env.SMARTPING_EMAIL;

    if (!appCode || !password || !email) {
      return {
        success: false,
        error: 'SmartPing credentials not configured',
        licensees: [],
        count: 0,
        source: "error",
        clubId
      };
    }

    // Initialize SmartPing API with proper authentication
    const smartPing = new SmartPingAPI(appCode, password, email);

    // Get licensees list with ranking from SmartPing API
    const result = await smartPing.getClubLicenseesWithRanking(clubId);

    if (result.success && result.data) {
      // Filter active licensees (valide field empty or 'O')
      const validLicensees = result.data.filter((licensee: any) => {
        return !licensee.valide || licensee.valide === 'O';
      });

      // Convert FFTT format to our format
      const mappedLicensees = validLicensees.map((licensee: any) => ({
        id: licensee.licence,
        licence: licensee.licence,
        firstName: licensee.prenom,
        lastName: licensee.nom,
        club: licensee.nclub,
        clubName: '',
        points: parseInt(licensee.points) || 0,
        ranking: licensee.classement || '',
        level: licensee.type || '',
        position: parseInt(licensee.place) || 0,
        nationality: '',
        gender: licensee.sexe || '',
        type: licensee.type || '',
        certificate: '',
        active: true,
        mixedLevel: licensee.echelon_mixte || '',
        // Raw FFTT fields for backward compatibility
        nom: licensee.nom,
        prenom: licensee.prenom,
        sexe: licensee.sexe,
        nclub: licensee.nclub,
        nlic: licensee.club,
        cat: licensee.cat || '', // FFTT category
        clast: licensee.clast || licensee.classement || '', // Map 'clast' field to 'clast' for frontend
        point: licensee.pointm || licensee.points || 0,
        avert: '', // Not available in current API
        valide: licensee.valide,
        echelon: licensee.echelon,
        place: licensee.place,
        pointm: licensee.pointm || '', // Monthly points
        apointm: licensee.apointm || '', // Previous monthly points
        initm: licensee.initm || '', // Initial value
        defim: '', // Not available in current API
        apoints: '', // Not available in current API
        inits: '', // Not available in current API
        defis: '', // Not available in current API
      }));

      // Sort licensees by last name, then first name
      mappedLicensees.sort((a: any, b: any) => {
        if (a.lastName !== b.lastName) {
          return a.lastName.localeCompare(b.lastName);
        }
        return a.firstName.localeCompare(b.firstName);
      });

      return {
        success: true,
        licensees: mappedLicensees,
        count: mappedLicensees.length,
        source: "smartping",
        clubId
      };
    } else {
      return {
        success: false,
        error: result.error || 'Unknown error from SmartPing API',
        licensees: [],
        count: 0,
        source: result.source || "error",
        clubId
      };
    }
  } catch (error) {
    console.error("Error fetching licensees:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      licensees: [],
      count: 0,
      source: "exception",
      clubId: getClubId()
    };
  }
});
