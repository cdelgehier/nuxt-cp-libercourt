import crypto from "crypto";
import { XMLParser } from "fast-xml-parser";

// Types for FFTT API responses
interface LicenseeData {
  licence: string;
  nom: string;
  prenom: string;
  club: string;
  nclub: string;
  points: number;
  classement: string;
  clast?: string; // FFTT exact field name for ranking from xml_liste_joueur.php
  cat?: string; // FFTT exact field name for category from xml_liste_joueur.php
  pointm?: string; // FFTT exact field name for monthly points from xml_liste_joueur.php
  echelon: string;
  place: number;
  natio: string;
  sexe: string;
  type: string;
  certif: string;
  valide: string;
  echelon_mixte: string;
}

interface TeamData {
  idequipe: string;
  libequipe: string;
  libdivision: string;
  liendivision: string;
  idepr: string;
  libepr: string;
}

interface MatchData {
  equa: string;
  equb: string;
  scorea: string;
  scoreb: string;
  resa: string;
  resb: string;
  dateprevue: string;
  datereelle: string;
  heuredebut: string;
  lien: string;
  nomjour: string;
  // IDs des équipes pour un filtrage précis
  equipId1: string;
  equipId2: string;
  // Informations additionnelles pour Google Maps
  opponentClub?: ClubDetails;
  googleMapsUrl?: string;
}

interface ClubDetails {
  numero: string;
  nom: string;
  adresse: string;
  codepostal: string;
  ville: string;
  telephone: string;
  courrielligue: string;
  web: string;
  latitude?: string;
  longitude?: string;
}

interface ClubSearchResult {
  numero: string;
  nom: string;
  ville: string;
}

interface MatchDetail {
  equa: string;
  equb: string;
  resa: string;
  resb: string;
  parties: PartieDetail[];
}

interface PartieDetail {
  ja: string; // Joueur A
  jb: string; // Joueur B
  scorea: string; // Score joueur A
  scoreb: string; // Score joueur B
  detail: string; // Détail des manches (ex: "11/3 9/11 11/4 11/4")
  xca?: string; // Classement joueur A
  xcb?: string; // Classement joueur B
}

// Type definitions for SmartPing API responses
interface SmartPingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: string;
}

/**
 * Modern FFTT SmartPing API client with proper encoding and authentication
 * Based on official FFTT API documentation (fftt_api.md)
 */
export class SmartPingAPI {
  private baseUrl = "https://www.fftt.com/mobile/pxml/";
  private appCode: string;
  private password: string;
  private email: string;

  constructor(appCode: string, password: string, email: string) {
    this.appCode = appCode;
    this.password = password;
    this.email = email;
  }

  /**
   * Generate authentication parameters according to FFTT specification
   * Cryptage du timestamp : MD5 du mot de passe + HMAC-SHA1 du timestamp
   */
  private getAuthParams() {
    // Generate timestamp in FFTT format: YYYYMMDDHHMMSSmmm
    const now = new Date();
    const tm =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0") +
      now.getSeconds().toString().padStart(2, "0") +
      now.getMilliseconds().toString().padStart(3, "0");

    // Hash password with MD5 (as per FFTT spec)
    const hashedPassword = crypto
      .createHash("md5")
      .update(this.password)
      .digest("hex");

    // Generate HMAC-SHA1 signature of timestamp
    const tmc = crypto
      .createHmac("sha1", hashedPassword)
      .update(tm)
      .digest("hex");

    return {
      serie: this.email, // Use email as serie for now
      tm: tm,
      tmc: tmc,
      id: this.appCode,
    };
  }

  /**
   * Get club licensees using xml_liste_joueur_o.php (SPID database)
   * According to FFTT documentation: "Liste des licenciés de la base SPID"
   */
  async getClubLicensees(
    clubId: string,
  ): Promise<SmartPingResult<LicenseeData[]>> {
    const url = `${this.baseUrl}xml_liste_joueur_o.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      club: clubId,
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      // Handle ISO-8859-1 encoding properly using TextDecoder (2025 modern approach)
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      console.log("FFTT Response:", {
        status: response.status,
        responseLength: responseText.length,
        hasJoueurs: responseText.includes("<joueur"),
        joueurCount: (responseText.match(/<joueur/g) || []).length,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<joueur")) {
        const licensees = this.parseXMLLicensees(responseText);
        console.log("SmartPing API SUCCESS:", {
          licenseesCount: licensees.length,
          sampleLicensee: licensees.length > 0 ? licensees[100] : null,
        });
        return { success: true, data: licensees };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error("Licensees API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get club licensees from FFTT using xml_liste_joueur.php
   * Returns: licence, nom, prenom, club, nclub, clast
   */
  async getClubLicenseesWithRanking(
    clubId: string,
  ): Promise<SmartPingResult<LicenseeData[]>> {
    const url = `${this.baseUrl}xml_liste_joueur.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      club: clubId,
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      // Handle ISO-8859-1 encoding properly
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<licence")) {
        const licensees = this.parseXMLLicenseesWithRanking(responseText);
        return { success: true, data: licensees };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error("xml_liste_joueur API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get club teams using xml_equipe.php
   * According to FFTT documentation: "Liste des équipes d'un club"
   */
  async getClubTeams(clubId: string): Promise<SmartPingResult<TeamData[]>> {
    const url = `${this.baseUrl}xml_equipe.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      numclu: clubId, // FFTT doc specifies 'numclu' for team queries - format 07XXXXXX required
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      // Handle ISO-8859-1 encoding properly
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      console.log("FFTT Teams Response:", {
        status: response.status,
        responseLength: responseText.length,
        hasEquipes: responseText.includes("<equipe"),
        equipeCount: (responseText.match(/<equipe/g) || []).length,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<equipe")) {
        const teams = this.parseXMLTeams(responseText);
        console.log("Teams API SUCCESS:", {
          teamsCount: teams.length,
          sampleTeam: teams.length > 0 ? teams[0] : null,
        });
        return { success: true, data: teams };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error("Teams API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get club licensees with complete information including categories using xml_licence_b.php
   * This API returns more detailed info including the "cat" field for categories
   */
  async getClubLicenseesWithCategories(
    clubId: string,
  ): Promise<SmartPingResult<LicenseeData[]>> {
    const url = `${this.baseUrl}xml_licence_b.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      club: clubId, // Use 'club' parameter to get all club licensees
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      // Handle ISO-8859-1 encoding properly
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<licence")) {
        const licensees = this.parseXMLLicenceB(responseText);
        return { success: true, data: licensees };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error("xml_licence_b club API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse XML licensees response according to FFTT xml_liste_joueur_o.php format
   */
  private parseXMLLicensees(xmlResponse: string): LicenseeData[] {
    const licensees: LicenseeData[] = [];
    const joueurMatches = xmlResponse.match(/<joueur>[\s\S]*?<\/joueur>/g);

    if (joueurMatches) {
      joueurMatches.forEach((match) => {
        const licensee: LicenseeData = {
          licence: this.extractTagValue(match, "licence") || "",
          nom: this.extractTagValue(match, "nom") || "",
          prenom: this.extractTagValue(match, "prenom") || "",
          club: this.extractTagValue(match, "club") || "",
          nclub: this.extractTagValue(match, "nclub") || "",
          points: parseInt(this.extractTagValue(match, "points") || "0"),
          classement: this.extractTagValue(match, "classement") || "",
          echelon: this.extractTagValue(match, "echelon") || "",
          place: parseInt(this.extractTagValue(match, "place") || "0"),
          natio: this.extractTagValue(match, "natio") || "",
          sexe: this.extractTagValue(match, "sexe") || "",
          type: this.extractTagValue(match, "type") || "",
          certif: this.extractTagValue(match, "certif") || "",
          valide: this.extractTagValue(match, "valide") || "",
          echelon_mixte: this.extractTagValue(match, "echelon_mixte") || "",
        };
        licensees.push(licensee);
      });
    }

    return licensees;
  }

  /**
   * Fix encoding issues for French characters from FFTT XML
   * Convert malformed UTF-8 sequences back to proper characters
   */
  private fixEncoding(text: string): string {
    if (!text) return text;

    // Map common malformed sequences to correct characters
    const encodingFixes: Record<string, string> = {
      "Ã©": "é", // é
      "Ã¨": "è", // è
      Ãª: "ê", // ê
      "Ã ": "à", // à
      "Ã´": "ô", // ô
      "Ã§": "ç", // ç
      "Ã¹": "ù", // ù
      "Ã»": "û", // û
      "Ã®": "î", // î
      "Ã¯": "ï", // ï
      "Ã‰": "É", // É
      "Ã€": "À", // À
      "Ã‡": "Ç", // Ç
    };

    let fixed = text;
    for (const [malformed, correct] of Object.entries(encodingFixes)) {
      fixed = fixed.replace(new RegExp(malformed, "g"), correct);
    }

    return fixed;
  }

  /**
   * Parse XML licensees with ranking response using proper XML parser
   * No more regex hell - clean XML parsing with fast-xml-parser
   */
  private parseXMLLicenseesWithRanking(xmlResponse: string): LicenseeData[] {
    // Configure XML parser options
    const options = {
      ignoreAttributes: false,
      parseAttributeValue: false,
      parseNodeValue: true,
      parseTrueNumberOnly: false,
      arrayMode: false,
      alwaysCreateTextNode: false,
      trimValues: true, // Trim whitespace
      isArray: (name: string, jpath: string) => {
        // Make sure 'joueur' elements are always treated as array
        return jpath === "liste.joueur";
      },
    };

    const parser = new XMLParser(options);
    const result = parser.parse(xmlResponse);

    const licensees: LicenseeData[] = [];

    // Extract joueur array from parsed XML (not licence!)
    const joueurs = result?.liste?.joueur || [];
    const joueurArray = Array.isArray(joueurs) ? joueurs : [joueurs];

    joueurArray.forEach((joueur: any, index: number) => {
      const licensee: LicenseeData = {
        licence: String(joueur.licence || ""), // License number from FFTT
        nom: this.fixEncoding(String(joueur.nom || "")), // Fix encoding for names
        prenom: this.fixEncoding(String(joueur.prenom || "")), // Fix encoding for first names
        club: String(joueur.club || ""), // Club name
        nclub: String(joueur.nclub || ""), // Club number
        clast: String(joueur.clast || ""), // Last classement
        cat: String(joueur.cat || ""), // Category
        pointm: String(joueur.pointm || ""), // Monthly points
        points: parseInt(String(joueur.pointm || "0")), // Monthly points as number
        classement: String(joueur.clast || ""), // Use clast as classement for compatibility
        echelon: String(joueur.echelon || ""),
        place: parseInt(String(joueur.place || "0")),
        natio: String(joueur.natio || ""),
        sexe: String(joueur.sexe || ""),
        type: String(joueur.type || ""),
        certif: String(joueur.certif || ""),
        valide: String(joueur.valide || ""),
        echelon_mixte: String(joueur.echelon_mixte || ""),
      };

      licensees.push(licensee);
    });

    return licensees;
  }

  /**
   * Parse XML joueurs response from xml_liste_joueur.php
   * Simple parsing with exact FFTT field names: licence, nom, prenom, club, nclub, clast
   */
  private parseXMLJoueurs(xmlResponse: string): LicenseeData[] {
    const licensees: LicenseeData[] = [];
    const joueurMatches = xmlResponse.match(/<joueur>[\s\S]*?<\/joueur>/g);

    if (joueurMatches) {
      joueurMatches.forEach((match) => {
        const licensee: LicenseeData = {
          licence: this.extractTagValue(match, "licence") || "",
          nom: this.extractTagValue(match, "nom") || "",
          prenom: this.extractTagValue(match, "prenom") || "",
          club: this.extractTagValue(match, "club") || "",
          nclub: this.extractTagValue(match, "nclub") || "",
          clast: this.extractTagValue(match, "clast") || "",
          // These fields are not available in xml_liste_joueur.php but needed for interface
          points: 0,
          classement: this.extractTagValue(match, "clast") || "", // Map clast to classement for compatibility
          echelon: "",
          place: 0,
          natio: "",
          sexe: "",
          type: "",
          certif: "",
          valide: "",
          echelon_mixte: "",
        };
        licensees.push(licensee);
      });
    }

    return licensees;
  }

  /**
   * Parse XML joueurs response from ranking database according to FFTT xml_liste_joueur.php format
   * Format: <joueur><licence>xxx</licence><nom>xxx</nom><prenom>xxx</prenom><club>xxx</club><nclub>xxx</nclub><clast>xxx</clast></joueur>
   */
  private parseXMLJoueursFromRankingDB(xmlResponse: string): LicenseeData[] {
    const licensees: LicenseeData[] = [];
    const joueurMatches = xmlResponse.match(/<joueur>[\s\S]*?<\/joueur>/g);

    if (joueurMatches) {
      joueurMatches.forEach((match) => {
        const licensee: LicenseeData = {
          licence: this.extractTagValue(match, "licence") || "",
          nom: this.extractTagValue(match, "nom") || "",
          prenom: this.extractTagValue(match, "prenom") || "",
          club: this.extractTagValue(match, "nclub") || "", // nclub is the club number
          nclub: this.extractTagValue(match, "club") || "", // club is the club name
          points: 0, // Not available in xml_liste_joueur.php
          classement: this.extractTagValue(match, "clast") || "", // clast contains the ranking
          echelon: "",
          place: 0,
          natio: "",
          sexe: "", // Not available in xml_liste_joueur.php
          type: "",
          certif: "",
          valide: "",
          echelon_mixte: "",
        };
        licensees.push(licensee);
      });
    }

    return licensees;
  }

  /**
   * Get detailed licensee information using xml_licence_b.php (SPID + classement)
   * Used when clicking on a licensee card for detailed view
   */
  async getLicenseeDetails(
    licenceNumber: string,
  ): Promise<SmartPingResult<LicenseeData | null>> {
    const url = `${this.baseUrl}xml_licence_b.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      licence: licenceNumber,
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      // Handle ISO-8859-1 encoding properly
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<licence")) {
        const licensee = this.parseXMLLicenseeDetails(responseText);
        return { success: true, data: licensee };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error("Licensee details API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse XML licensee details response from xml_licence_b.php
   * This API returns detailed info for a single license
   */
  private parseXMLLicenseeDetails(xmlResponse: string): LicenseeData | null {
    // Configure XML parser options
    const options = {
      ignoreAttributes: false,
      parseAttributeValue: false,
      parseNodeValue: true,
      parseTrueNumberOnly: false,
      arrayMode: false,
      alwaysCreateTextNode: false,
      trimValues: true,
    };

    const parser = new XMLParser(options);
    const result = parser.parse(xmlResponse);

    // xml_licence_b.php returns <liste><licence>...</licence></liste>
    const licence = result?.liste?.licence;

    if (!licence) {
      console.log("No licence element found in parsed XML");
      return null;
    }

    const licensee: LicenseeData = {
      licence: String(licence.licence || ""), // License number from FFTT doc
      nom: this.fixEncoding(String(licence.nom || "")), // Fix encoding for names
      prenom: this.fixEncoding(String(licence.prenom || "")), // Fix encoding for first names
      club: String(licence.nomclub || ""), // Club name = nomclub according to FFTT doc
      nclub: String(licence.numclub || ""), // Club number = numclub according to FFTT doc
      clast: String(licence.point || ""), // Use point as clast (classement points)
      cat: String(licence.cat || ""), // Category from FFTT doc
      pointm: String(licence.pointm || ""), // Monthly points from FFTT doc
      points: parseInt(String(licence.pointm || licence.point || "0")), // Monthly or regular points
      classement: String(licence.point || ""), // Use point as classement
      echelon: String(licence.echelon || ""),
      place: parseInt(String(licence.place || "0")),
      natio: String(licence.natio || ""),
      sexe: String(licence.sexe || ""),
      type: String(licence.type || ""),
      certif: String(licence.certif || ""),
      valide: String(licence.validation || ""), // validation according to FFTT doc
      echelon_mixte: String(licence.echelon_mixte || ""),
    };

    return licensee;
  }

  /**
   * Parse XML response from xml_licence_b.php for club licensees
   * This API returns <licence> elements instead of <joueur> elements
   */
  private parseXMLLicenceB(xmlResponse: string): LicenseeData[] {
    // Configure XML parser options
    const options = {
      ignoreAttributes: false,
      parseAttributeValue: false,
      parseNodeValue: true,
      parseTrueNumberOnly: false,
      arrayMode: false,
      alwaysCreateTextNode: false,
      trimValues: true,
    };

    const parser = new XMLParser(options);
    const result = parser.parse(xmlResponse);

    // xml_licence_b.php returns <liste><licence>...</licence>...</liste>
    const licences = result?.liste?.licence;

    if (!licences) {
      console.log("No licence elements found in parsed XML");
      return [];
    }

    // Handle both single licence and array of licences
    const licenceArray = Array.isArray(licences) ? licences : [licences];

    const licensees: LicenseeData[] = licenceArray.map((licence: any) => ({
      licence: String(licence.licence || ""), // License number from FFTT doc
      nom: this.fixEncoding(String(licence.nom || "")), // Fix encoding for names
      prenom: this.fixEncoding(String(licence.prenom || "")), // Fix encoding for first names
      club: String(licence.nomclub || ""), // Club name = nomclub according to FFTT doc
      nclub: String(licence.numclub || ""), // Club number = numclub according to FFTT doc
      clast: String(licence.point || ""), // Use point as clast (classement points)
      cat: String(licence.cat || ""), // Category from FFTT doc
      pointm: String(licence.pointm || ""), // Monthly points from FFTT doc
      points: parseInt(String(licence.pointm || licence.point || "0")), // Monthly or regular points
      classement: String(licence.point || ""), // Use point as classement
      echelon: String(licence.echelon || ""),
      place: parseInt(String(licence.place || "0")),
      natio: String(licence.natio || ""),
      sexe: String(licence.sexe || ""),
      type: String(licence.type || ""),
      certif: String(licence.certif || ""),
      valide: String(licence.validation || ""), // validation according to FFTT doc
      echelon_mixte: String(licence.echelon_mixte || ""),
    }));

    return licensees;
  }

  /**
   * Parse XML teams response according to FFTT xml_equipe.php format
   */
  private parseXMLTeams(xmlResponse: string): TeamData[] {
    const teams: TeamData[] = [];
    const equipeMatches = xmlResponse.match(/<equipe>[\s\S]*?<\/equipe>/g);

    if (equipeMatches) {
      equipeMatches.forEach((match) => {
        const team: TeamData = {
          idequipe: this.extractTagValue(match, "idequipe") || "",
          libequipe: this.extractTagValue(match, "libequipe") || "",
          libdivision: this.extractTagValue(match, "libdivision") || "",
          liendivision: this.extractTagValue(match, "liendivision") || "",
          idepr: this.extractTagValue(match, "idepr") || "",
          libepr: this.extractTagValue(match, "libepr") || "",
        };
        teams.push(team);
      });
    }

    return teams;
  }

  /**
   * Extract XML tag value (FFTT uses XML tags, not attributes)
   * No more archaïc fixEncoding - proper TextDecoder handles it in 2025
   */
  private extractTagValue(xmlMatch: string, tagName: string): string | null {
    // Handle CDATA sections for liendivision and lien
    if (tagName === "liendivision" || tagName === "lien") {
      const cdataRegex = new RegExp(
        `<${tagName}><\\!\\[CDATA\\[([^\\]]+)\\]\\]></${tagName}>`,
        "i",
      );
      const cdataMatch = xmlMatch.match(cdataRegex);
      if (cdataMatch) {
        return cdataMatch[1];
      }
    }

    const regex = new RegExp(`<${tagName}>([^<]*)</${tagName}>`, "i");
    const match = xmlMatch.match(regex);
    const result = match ? match[1] : null;

    return result;
  }

  /**
   * Parse URL parameters from liendivision field
   */
  private parseUrlParams(urlString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const pairs = urlString.split("&");

    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key && value) {
        params[key] = value;
      }
    }

    return params;
  }

  /**
   * Parse XML matches response from xml_result_equ.php
   */
  private parseXMLMatches(xmlResponse: string): MatchData[] {
    const matches: MatchData[] = [];
    const tourMatches = xmlResponse.match(/<tour>[\s\S]*?<\/tour>/g);

    if (tourMatches) {
      tourMatches.forEach((match) => {
        const lienContent = this.extractTagValue(match, "lien") || "";

        // Extract equip_id1 and equip_id2 from lien field
        // The lien field contains URL-encoded data in CDATA
        const equipId1Match = lienContent.match(/equip_id1=(\d+)/);
        const equipId2Match = lienContent.match(/equip_id2=(\d+)/);

        const tour: MatchData = {
          equa: this.extractTagValue(match, "equa") || "",
          equb: this.extractTagValue(match, "equb") || "",
          scorea: this.extractTagValue(match, "scorea") || "",
          scoreb: this.extractTagValue(match, "scoreb") || "",
          resa: this.extractTagValue(match, "resa") || "",
          resb: this.extractTagValue(match, "resb") || "",
          dateprevue: this.extractTagValue(match, "dateprevue") || "",
          datereelle: this.extractTagValue(match, "datereelle") || "",
          heuredebut: this.extractTagValue(match, "heuredebut") || "",
          lien: lienContent,
          nomjour: this.extractTagValue(match, "nomjour") || "",
          equipId1: equipId1Match ? equipId1Match[1] : "",
          equipId2: equipId2Match ? equipId2Match[1] : "",
        };
        matches.push(tour);
      });
    }

    return matches;
  }

  /**
   * Get matches for a specific team using xml_result_equ.php
   * Uses the liendivision parameter from team data to retrieve pool matches
   */
  async getTeamMatches(
    team: TeamData,
    clubName: string = "LIBERCOURT",
  ): Promise<SmartPingResult<MatchData[]>> {
    const url = `${this.baseUrl}xml_result_equ.php`;
    const authParams = this.getAuthParams();

    // Parse parameters from liendivision
    const pouleParams = this.parseUrlParams(team.liendivision);

    if (!pouleParams.cx_poule || !pouleParams.D1) {
      return {
        success: false,
        error: "Missing required pool parameters (cx_poule or D1) in team data",
        source: "team_validation",
      };
    }

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      cx_poule: pouleParams.cx_poule,
      D1: pouleParams.D1,
      organisme_pere: pouleParams.organisme_pere || "67",
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      console.log("FFTT Matches Response:", {
        status: response.status,
        responseLength: responseText.length,
        hasMatches: responseText.includes("<tour"),
        matchCount: (responseText.match(/<tour/g) || []).length,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<tour")) {
        const allMatches = this.parseXMLMatches(responseText);

        // Filter matches for the specific team using precise team ID
        const teamMatches = allMatches.filter(
          (match) =>
            match.equipId1 === team.idequipe ||
            match.equipId2 === team.idequipe,
        );

        console.log("Team Matches API SUCCESS:", {
          totalMatches: allMatches.length,
          teamSpecificMatches: teamMatches.length,
          teamName: team.libequipe,
          teamId: team.idequipe,
        });

        return { success: true, data: teamMatches };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error("Team matches API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get club information from team using FFTT API
   * Uses xml_result_equ.php to find club number from team data, then xml_club_detail.php for details
   */
  async getClubFromTeam(
    teamData: TeamData,
  ): Promise<SmartPingResult<ClubDetails | null>> {
    // Extract pool parameters from team's liendivision
    const pouleParams = this.parseUrlParams(teamData.liendivision);

    if (!pouleParams.cx_poule || !pouleParams.D1) {
      return {
        success: false,
        error: "Missing required pool parameters (cx_poule or D1) in team data",
        source: "team_validation",
      };
    }

    // Step 1: Get classement to find club number for this team
    const url = `${this.baseUrl}xml_result_equ.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      action: "classement",
      cx_poule: pouleParams.cx_poule,
      D1: pouleParams.D1,
      organisme_pere: pouleParams.organisme_pere || "67",
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      console.log("FFTT Team Classement Response:", {
        status: response.status,
        responseLength: responseText.length,
        hasClassement: responseText.includes("<classement"),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      // Parse classement to find club number for our team
      let clubNumber: string | null = null;
      const classementMatches = responseText.match(
        /<classement>[\s\S]*?<\/classement>/g,
      );

      if (classementMatches) {
        for (const match of classementMatches) {
          const idequipe = this.extractTagValue(match, "idequipe");
          if (idequipe === teamData.idequipe) {
            clubNumber = this.extractTagValue(match, "numero");
            break;
          }
        }
      }

      if (!clubNumber) {
        return {
          success: false,
          error: `Could not find club number for team ${teamData.libequipe} (ID: ${teamData.idequipe})`,
          source: "team_not_found_in_classement",
        };
      }

      console.log("Found club number for team:", {
        teamName: teamData.libequipe,
        teamId: teamData.idequipe,
        clubNumber,
      });

      // Step 2: Get club details using the found club number
      const clubDetailsResult = await this.getClubDetails(
        clubNumber,
        teamData.idequipe,
      );

      if (clubDetailsResult.success && clubDetailsResult.data) {
        return {
          success: true,
          data: clubDetailsResult.data,
          source: "fftt_team_club_lookup",
        };
      } else {
        return {
          success: false,
          error: `Found club number ${clubNumber} but failed to get club details: ${clubDetailsResult.error}`,
          source: "club_details_failed",
        };
      }
    } catch (error) {
      console.error("Team club lookup API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "api_error",
      };
    }
  }

  /**
   * Get club details using xml_club_detail.php
   * Returns club address information for Google Maps integration
   */
  async getClubDetails(
    clubNumber: string,
    idequipe?: string,
  ): Promise<SmartPingResult<ClubDetails | null>> {
    const url = `${this.baseUrl}xml_club_detail.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      club: clubNumber,
    });

    // Add idequipe parameter if provided (for team-specific hall info)
    if (idequipe) {
      params.append("idequipe", idequipe);
    }

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      console.log("FFTT Club Details Response:", {
        status: response.status,
        responseLength: responseText.length,
        hasClub: responseText.includes("<club"),
        clubNumber,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<club")) {
        const clubDetails = this.parseXMLClubDetails(responseText);
        return { success: true, data: clubDetails };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error("Club details API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse XML club details response from xml_club_detail.php
   */
  private parseXMLClubDetails(xmlResponse: string): ClubDetails | null {
    const clubMatch = xmlResponse.match(/<club>[\s\S]*?<\/club>/);

    if (!clubMatch) {
      return null;
    }

    const match = clubMatch[0];

    // Build address from multiple address fields
    const adressesalle1 = this.fixEncoding(
      this.extractTagValue(match, "adressesalle1") || "",
    );
    const adressesalle2 = this.fixEncoding(
      this.extractTagValue(match, "adressesalle2") || "",
    );
    const adressesalle3 = this.fixEncoding(
      this.extractTagValue(match, "adressesalle3") || "",
    );

    const addressParts = [adressesalle1, adressesalle2, adressesalle3].filter(
      (part) => part.trim() !== "",
    );
    const fullAddress = addressParts.join(", ");

    return {
      numero: this.extractTagValue(match, "numero") || "",
      nom: this.fixEncoding(this.extractTagValue(match, "nom") || ""),
      adresse: fullAddress,
      codepostal: this.extractTagValue(match, "codepsalle") || "",
      ville: this.fixEncoding(this.extractTagValue(match, "villesalle") || ""),
      telephone: this.extractTagValue(match, "telcor") || "",
      courrielligue: this.extractTagValue(match, "mailcor") || "",
      web: this.extractTagValue(match, "web") || "",
      latitude: this.extractTagValue(match, "latitude") || "",
      longitude: this.extractTagValue(match, "longitude") || "",
    };
  }

  /**
   * Get match details using xml_chp_renc.php
   * According to FFTT documentation: "Renvoie les informations détaillées d'une rencontre"
   * Takes the 'lien' parameter from a match data
   */
  async getMatchDetails(
    lienParam: string,
  ): Promise<SmartPingResult<MatchDetail | null>> {
    const url = `${this.baseUrl}xml_chp_renc.php`;
    const authParams = this.getAuthParams();

    // Parse lien parameter to extract required params
    const linkParams = this.parseUrlParams(lienParam);

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      ...linkParams, // Add all parameters from lien
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      console.log("FFTT Match Details Response:", {
        status: response.status,
        responseLength: responseText.length,
        hasResultat: responseText.includes("<resultat"),
        hasPartie: responseText.includes("<partie"),
        partieCount: (responseText.match(/<partie/g) || []).length,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<resultat")) {
        const matchDetail = this.parseXMLMatchDetails(responseText);
        return { success: true, data: matchDetail };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error("Match details API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Search clubs using xml_club_b.php
   * This can help find club numbers dynamically
   */
  async searchClubs(
    ville?: string,
    nom?: string,
  ): Promise<SmartPingResult<ClubSearchResult[]>> {
    const url = `${this.baseUrl}xml_club_b.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
    });

    // Ajouter les paramètres de recherche
    if (ville) params.append("ville", ville);
    if (nom) params.append("nom", nom);

    try {
      const response = await fetch(`${url}?${params}`, {
        method: "GET",
        headers: {
          "User-Agent": "Club Pongiste Libercourtois",
          Accept: "application/xml, text/xml, */*",
        },
      });

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const responseText = decoder.decode(buffer);

      console.log("FFTT Club Search Response:", {
        status: response.status,
        responseLength: responseText.length,
        hasClubs: responseText.includes("<club"),
        clubCount: (responseText.match(/<club/g) || []).length,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${responseText}`,
        };
      }

      if (
        responseText.includes("<erreurs>") ||
        responseText.includes("<erreur>")
      ) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : "Unknown FFTT error";
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes("<club")) {
        const clubs = this.parseXMLClubSearch(responseText);
        return { success: true, data: clubs };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error("Club search API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse XML club search response from xml_club_b.php
   */
  private parseXMLClubSearch(xmlResponse: string): ClubSearchResult[] {
    const clubs: ClubSearchResult[] = [];
    const clubMatches = xmlResponse.match(/<club>[\s\S]*?<\/club>/g);

    if (clubMatches) {
      clubMatches.forEach((match) => {
        const club: ClubSearchResult = {
          numero: this.extractTagValue(match, "numero") || "",
          nom: this.fixEncoding(this.extractTagValue(match, "nom") || ""),
          ville: this.fixEncoding(this.extractTagValue(match, "ville") || ""),
        };
        clubs.push(club);
      });
    }

    return clubs;
  }

  /**
   * Parse XML match details response from xml_chp_renc.php
   * According to FFTT spec, returns: <resultat>, then <joueur> pairs, then <partie> details
   */
  private parseXMLMatchDetails(xmlResponse: string): MatchDetail | null {
    // Extract resultat section
    const resultatMatch = xmlResponse.match(/<resultat>[\s\S]*?<\/resultat>/);
    if (!resultatMatch) {
      return null;
    }

    const resultat = resultatMatch[0];
    const equa = this.extractTagValue(resultat, "equa") || "";
    const equb = this.extractTagValue(resultat, "equb") || "";
    const resa = this.extractTagValue(resultat, "resa") || "";
    const resb = this.extractTagValue(resultat, "resb") || "";

    // Extract joueur pairs for classement info
    const joueurPairs: Array<{
      xja: string;
      xca: string;
      xjb: string;
      xcb: string;
    }> = [];
    const joueurMatches = xmlResponse.match(/<joueur>[\s\S]*?<\/joueur>/g);

    if (joueurMatches) {
      joueurMatches.forEach((match) => {
        const pair = {
          xja: this.fixEncoding(this.extractTagValue(match, "xja") || ""),
          xca: this.extractTagValue(match, "xca") || "",
          xjb: this.fixEncoding(this.extractTagValue(match, "xjb") || ""),
          xcb: this.extractTagValue(match, "xcb") || "",
        };
        joueurPairs.push(pair);
      });
    }

    // Extract partie details
    const parties: PartieDetail[] = [];
    const partieMatches = xmlResponse.match(/<partie>[\s\S]*?<\/partie>/g);

    if (partieMatches) {
      partieMatches.forEach((match, index) => {
        const ja = this.fixEncoding(this.extractTagValue(match, "ja") || "");
        const jb = this.fixEncoding(this.extractTagValue(match, "jb") || "");
        const scorea = this.extractTagValue(match, "scorea") || "";
        const scoreb = this.extractTagValue(match, "scoreb") || "";
        const detail = this.extractTagValue(match, "detail") || "";

        // Try to match with joueur pair for classement
        let xca = "";
        let xcb = "";

        // Find matching joueur pair based on names
        const matchingPair = joueurPairs.find(
          (pair) =>
            pair.xja.includes(ja.split(" ")[0]) ||
            pair.xjb.includes(jb.split(" ")[0]),
        );

        if (matchingPair) {
          xca = matchingPair.xca;
          xcb = matchingPair.xcb;
        }

        const partie: PartieDetail = {
          ja,
          jb,
          scorea,
          scoreb,
          detail,
          xca,
          xcb,
        };
        parties.push(partie);
      });
    }

    return {
      equa,
      equb,
      resa,
      resb,
      parties,
    };
  }
}

/**
 * Fetch licensees for a club using modern FFTT API with ranking data (xml_licence_b.php)
 * Export function for use in Nuxt API routes
 */
export async function fetchLicenseesWithSmartPing(
  clubId: string,
): Promise<SmartPingResult<LicenseeData[]>> {
  const config = useRuntimeConfig();
  const appCode = config.smartpingAppCode;
  const password = config.smartpingPassword;
  const email = config.smartpingEmail;

  if (!appCode || !password || !email) {
    console.error("Missing SmartPing credentials");
    return {
      success: false,
      error: "Missing SmartPing API credentials",
      source: "config",
    };
  }

  try {
    const smartPingApi = new SmartPingAPI(appCode, password, email);
    const result = await smartPingApi.getClubLicenseesWithRanking(clubId);

    return {
      ...result,
      source: "xml_licence_b",
    };
  } catch (error) {
    console.error("SmartPing API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "xml_licence_b",
    };
  }
}

/**
 * Fetch teams for a club using modern FFTT API
 * Export function for use in Nuxt API routes
 */
export async function fetchTeamsWithSmartPing(
  clubId: string,
): Promise<SmartPingResult<TeamData[]>> {
  const config = useRuntimeConfig();
  const appCode = config.smartpingAppCode;
  const password = config.smartpingPassword;
  const email = config.smartpingEmail;

  if (!appCode || !password || !email) {
    console.error("Missing SmartPing credentials");
    return {
      success: false,
      error: "Missing SmartPing API credentials",
      source: "config",
    };
  }

  try {
    const smartPingApi = new SmartPingAPI(appCode, password, email);
    const result = await smartPingApi.getClubTeams(clubId);

    return {
      ...result,
      source: "smartping_api",
    };
  } catch (error) {
    console.error("SmartPing Teams API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "smartping_api",
    };
  }
}

/**
 * Fetch matches for a specific team using modern FFTT API
 * Export function for use in Nuxt API routes
 */
export async function fetchTeamMatchesWithSmartPing(
  team: TeamData,
  clubName: string = "LIBERCOURT",
): Promise<SmartPingResult<MatchData[]>> {
  const config = useRuntimeConfig();
  const appCode = config.smartpingAppCode;
  const password = config.smartpingPassword;
  const email = config.smartpingEmail;

  if (!appCode || !password || !email) {
    console.error("Missing SmartPing credentials");
    return {
      success: false,
      error: "Missing SmartPing API credentials",
      source: "config",
    };
  }

  try {
    const smartPingApi = new SmartPingAPI(appCode, password, email);
    const result = await smartPingApi.getTeamMatches(team, clubName);

    return {
      ...result,
      source: "smartping_matches_api",
    };
  } catch (error) {
    console.error("SmartPing Team Matches API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "smartping_matches_api",
    };
  }
}

/**
 * Fetch match details using modern FFTT API
 * Export function for use in Nuxt API routes
 */
export async function fetchMatchDetailsWithSmartPing(
  lienParam: string,
): Promise<SmartPingResult<MatchDetail | null>> {
  const config = useRuntimeConfig();
  const appCode = config.smartpingAppCode;
  const password = config.smartpingPassword;
  const email = config.smartpingEmail;

  if (!appCode || !password || !email) {
    console.error("Missing SmartPing credentials");
    return {
      success: false,
      error: "Missing SmartPing API credentials",
      source: "config",
    };
  }

  try {
    const smartPingApi = new SmartPingAPI(appCode, password, email);
    const result = await smartPingApi.getMatchDetails(lienParam);

    return {
      ...result,
      source: "smartping_match_details_api",
    };
  } catch (error) {
    console.error("SmartPing Match Details API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source: "smartping_match_details_api",
    };
  }
}
