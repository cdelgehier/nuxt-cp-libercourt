import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';

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
  libequipe: string;
  libdivision: string;
  liendivision: string;
  idepr: string;
  libepr: string;
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
  private baseUrl = 'https://www.fftt.com/mobile/pxml/';
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
    const tm = now.getFullYear().toString() +
               (now.getMonth() + 1).toString().padStart(2, '0') +
               now.getDate().toString().padStart(2, '0') +
               now.getHours().toString().padStart(2, '0') +
               now.getMinutes().toString().padStart(2, '0') +
               now.getSeconds().toString().padStart(2, '0') +
               now.getMilliseconds().toString().padStart(3, '0');

    // Hash password with MD5 (as per FFTT spec)
    const hashedPassword = crypto.createHash('md5').update(this.password).digest('hex');

    // Generate HMAC-SHA1 signature of timestamp
    const tmc = crypto.createHmac('sha1', hashedPassword).update(tm).digest('hex');

    return {
      serie: this.email, // Use email as serie for now
      tm: tm,
      tmc: tmc,
      id: this.appCode
    };
  }

  /**
   * Get club licensees using xml_liste_joueur_o.php (SPID database)
   * According to FFTT documentation: "Liste des licenciés de la base SPID"
   */
  async getClubLicensees(clubId: string): Promise<SmartPingResult<LicenseeData[]>> {
    const url = `${this.baseUrl}xml_liste_joueur_o.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      club: clubId
    });

    try {

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Club Pongiste Libercourtois',
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      // Handle ISO-8859-1 encoding properly using TextDecoder (2025 modern approach)
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const responseText = decoder.decode(buffer);

      console.log('FFTT Response:', {
        status: response.status,
        responseLength: responseText.length,
        hasJoueurs: responseText.includes('<joueur'),
        joueurCount: (responseText.match(/<joueur/g) || []).length
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${responseText}` };
      }

      if (responseText.includes('<erreurs>') || responseText.includes('<erreur>')) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : 'Unknown FFTT error';
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes('<joueur')) {
        const licensees = this.parseXMLLicensees(responseText);
        console.log('SmartPing API SUCCESS:', {
          licenseesCount: licensees.length,
          sampleLicensee: licensees.length > 0 ? licensees[100] : null
        });
        return { success: true, data: licensees };
      }

      return { success: true, data: [] };

    } catch (error) {
      console.error('Licensees API request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get club licensees from FFTT using xml_liste_joueur.php
   * Returns: licence, nom, prenom, club, nclub, clast
   */
  async getClubLicenseesWithRanking(clubId: string): Promise<SmartPingResult<LicenseeData[]>> {
    const url = `${this.baseUrl}xml_liste_joueur.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      club: clubId
    });

    try {

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Club Pongiste Libercourtois',
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      // Handle ISO-8859-1 encoding properly
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const responseText = decoder.decode(buffer);


      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${responseText}` };
      }

      if (responseText.includes('<erreurs>') || responseText.includes('<erreur>')) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : 'Unknown FFTT error';
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes('<licence')) {
        const licensees = this.parseXMLLicenseesWithRanking(responseText);
        return { success: true, data: licensees };
      }

      return { success: true, data: [] };

    } catch (error) {
      console.error('xml_liste_joueur API request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
      numclu: clubId, // FFTT doc specifies 'numclu' for team queries
      type: '' // Empty for all teams (M=masculine, F=feminine, A=both championships)
    });

    try {

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Club Pongiste Libercourtois',
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      // Handle ISO-8859-1 encoding properly
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const responseText = decoder.decode(buffer);

      console.log('FFTT Teams Response:', {
        status: response.status,
        responseLength: responseText.length,
        hasEquipes: responseText.includes('<equipe'),
        equipeCount: (responseText.match(/<equipe/g) || []).length
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${responseText}` };
      }

      if (responseText.includes('<erreurs>') || responseText.includes('<erreur>')) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : 'Unknown FFTT error';
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes('<equipe')) {
        const teams = this.parseXMLTeams(responseText);
        console.log('Teams API SUCCESS:', {
          teamsCount: teams.length,
          sampleTeam: teams.length > 0 ? teams[0] : null
        });
        return { success: true, data: teams };
      }

      return { success: true, data: [] };

    } catch (error) {
      console.error('Teams API request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get club licensees with complete information including categories using xml_licence_b.php
   * This API returns more detailed info including the "cat" field for categories
   */
  async getClubLicenseesWithCategories(clubId: string): Promise<SmartPingResult<LicenseeData[]>> {
    const url = `${this.baseUrl}xml_licence_b.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      club: clubId // Use 'club' parameter to get all club licensees
    });

    try {
      console.log('FFTT xml_licence_b club API call:', { url, clubId });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Club Pongiste Libercourtois',
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      // Handle ISO-8859-1 encoding properly
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const responseText = decoder.decode(buffer);

      console.log('FFTT xml_licence_b club Response:', {
        status: response.status,
        responseLength: responseText.length,
        hasLicences: responseText.includes('<licence'),
        licenceCount: (responseText.match(/<licence/g) || []).length
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${responseText}` };
      }

      if (responseText.includes('<erreurs>') || responseText.includes('<erreur>')) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : 'Unknown FFTT error';
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes('<licence')) {
        const licensees = this.parseXMLLicenseesWithRanking(responseText);
        console.log('SmartPing xml_licence_b club SUCCESS:', {
          licenseesCount: licensees.length,
          sampleLicensee: licensees.length > 0 ? licensees[0] : null
        });
        return { success: true, data: licensees };
      }

      return { success: true, data: [] };

    } catch (error) {
      console.error('xml_licence_b club API request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Parse XML licensees response according to FFTT xml_liste_joueur_o.php format
   */
  private parseXMLLicensees(xmlResponse: string): LicenseeData[] {
    const licensees: LicenseeData[] = [];
    const joueurMatches = xmlResponse.match(/<joueur>[\s\S]*?<\/joueur>/g);

    if (joueurMatches) {
      joueurMatches.forEach(match => {
        const licensee: LicenseeData = {
          licence: this.extractTagValue(match, 'licence') || '',
          nom: this.extractTagValue(match, 'nom') || '',
          prenom: this.extractTagValue(match, 'prenom') || '',
          club: this.extractTagValue(match, 'club') || '',
          nclub: this.extractTagValue(match, 'nclub') || '',
          points: parseInt(this.extractTagValue(match, 'points') || '0'),
          classement: this.extractTagValue(match, 'classement') || '',
          echelon: this.extractTagValue(match, 'echelon') || '',
          place: parseInt(this.extractTagValue(match, 'place') || '0'),
          natio: this.extractTagValue(match, 'natio') || '',
          sexe: this.extractTagValue(match, 'sexe') || '',
          type: this.extractTagValue(match, 'type') || '',
          certif: this.extractTagValue(match, 'certif') || '',
          valide: this.extractTagValue(match, 'valide') || '',
          echelon_mixte: this.extractTagValue(match, 'echelon_mixte') || ''
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
      'Ã©': 'é', // é
      'Ã¨': 'è', // è
      'Ãª': 'ê', // ê
      'Ã ': 'à', // à
      'Ã´': 'ô', // ô
      'Ã§': 'ç', // ç
      'Ã¹': 'ù', // ù
      'Ã»': 'û', // û
      'Ã®': 'î', // î
      'Ã¯': 'ï', // ï
      'Ã‰': 'É', // É
      'Ã€': 'À', // À
      'Ã‡': 'Ç'  // Ç
    };

    let fixed = text;
    for (const [malformed, correct] of Object.entries(encodingFixes)) {
      fixed = fixed.replace(new RegExp(malformed, 'g'), correct);
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
        return jpath === 'liste.joueur';
      }
    };

    const parser = new XMLParser(options);
    const result = parser.parse(xmlResponse);


    const licensees: LicenseeData[] = [];

    // Extract joueur array from parsed XML (not licence!)
    const joueurs = result?.liste?.joueur || [];
    const joueurArray = Array.isArray(joueurs) ? joueurs : [joueurs];

    joueurArray.forEach((joueur: any, index: number) => {

      const licensee: LicenseeData = {
        licence: String(joueur.licence || ''), // License number from FFTT
        nom: this.fixEncoding(String(joueur.nom || '')), // Fix encoding for names
        prenom: this.fixEncoding(String(joueur.prenom || '')), // Fix encoding for first names
        club: String(joueur.club || ''), // Club name
        nclub: String(joueur.nclub || ''), // Club number
        clast: String(joueur.clast || ''), // Last classement
        cat: String(joueur.cat || ''), // Category
        pointm: String(joueur.pointm || ''), // Monthly points
        points: parseInt(String(joueur.pointm || '0')), // Monthly points as number
        classement: String(joueur.clast || ''), // Use clast as classement for compatibility
        echelon: String(joueur.echelon || ''),
        place: parseInt(String(joueur.place || '0')),
        natio: String(joueur.natio || ''),
        sexe: String(joueur.sexe || ''),
        type: String(joueur.type || ''),
        certif: String(joueur.certif || ''),
        valide: String(joueur.valide || ''),
        echelon_mixte: String(joueur.echelon_mixte || '')
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
      joueurMatches.forEach(match => {
        const licensee: LicenseeData = {
          licence: this.extractTagValue(match, 'licence') || '',
          nom: this.extractTagValue(match, 'nom') || '',
          prenom: this.extractTagValue(match, 'prenom') || '',
          club: this.extractTagValue(match, 'club') || '',
          nclub: this.extractTagValue(match, 'nclub') || '',
          clast: this.extractTagValue(match, 'clast') || '',
          // These fields are not available in xml_liste_joueur.php but needed for interface
          points: 0,
          classement: this.extractTagValue(match, 'clast') || '', // Map clast to classement for compatibility
          echelon: '',
          place: 0,
          natio: '',
          sexe: '',
          type: '',
          certif: '',
          valide: '',
          echelon_mixte: ''
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
      joueurMatches.forEach(match => {
        const licensee: LicenseeData = {
          licence: this.extractTagValue(match, 'licence') || '',
          nom: this.extractTagValue(match, 'nom') || '',
          prenom: this.extractTagValue(match, 'prenom') || '',
          club: this.extractTagValue(match, 'nclub') || '', // nclub is the club number
          nclub: this.extractTagValue(match, 'club') || '', // club is the club name
          points: 0, // Not available in xml_liste_joueur.php
          classement: this.extractTagValue(match, 'clast') || '', // clast contains the ranking
          echelon: '',
          place: 0,
          natio: '',
          sexe: '', // Not available in xml_liste_joueur.php
          type: '',
          certif: '',
          valide: '',
          echelon_mixte: ''
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
  async getLicenseeDetails(licenceNumber: string): Promise<SmartPingResult<LicenseeData | null>> {
    const url = `${this.baseUrl}xml_licence_b.php`;
    const authParams = this.getAuthParams();

    const params = new URLSearchParams({
      serie: authParams.serie,
      tm: authParams.tm,
      tmc: authParams.tmc,
      id: authParams.id,
      licence: licenceNumber
    });

    try {

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Club Pongiste Libercourtois',
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      // Handle ISO-8859-1 encoding properly
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const responseText = decoder.decode(buffer);

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${responseText}` };
      }

      if (responseText.includes('<erreurs>') || responseText.includes('<erreur>')) {
        const errorMatch = responseText.match(/<erreur>([^<]+)<\/erreur>/);
        const errorMessage = errorMatch ? errorMatch[1] : 'Unknown FFTT error';
        return { success: false, error: `FFTT Error: ${errorMessage}` };
      }

      if (responseText.includes('<licence')) {
        const licensee = this.parseXMLLicenseeDetails(responseText);
        return { success: true, data: licensee };
      }

      return { success: true, data: null };

    } catch (error) {
      console.error('Licensee details API request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
      trimValues: true
    };

    const parser = new XMLParser(options);
    const result = parser.parse(xmlResponse);

    // xml_licence_b.php returns <liste><licence>...</licence></liste>
    const licence = result?.liste?.licence;

    if (!licence) {
      console.log('No licence element found in parsed XML');
      return null;
    }


    const licensee: LicenseeData = {
      licence: String(licence.licence || ''), // License number from FFTT doc
      nom: this.fixEncoding(String(licence.nom || '')), // Fix encoding for names
      prenom: this.fixEncoding(String(licence.prenom || '')), // Fix encoding for first names
      club: String(licence.nomclub || ''), // Club name = nomclub according to FFTT doc
      nclub: String(licence.numclub || ''), // Club number = numclub according to FFTT doc
      clast: String(licence.point || ''), // Use point as clast (classement points)
      cat: String(licence.cat || ''), // Category from FFTT doc
      pointm: String(licence.pointm || ''), // Monthly points from FFTT doc
      points: parseInt(String(licence.pointm || licence.point || '0')), // Monthly or regular points
      classement: String(licence.point || ''), // Use point as classement
      echelon: String(licence.echelon || ''),
      place: parseInt(String(licence.place || '0')),
      natio: String(licence.natio || ''),
      sexe: String(licence.sexe || ''),
      type: String(licence.type || ''),
      certif: String(licence.certif || ''),
      valide: String(licence.validation || ''), // validation according to FFTT doc
      echelon_mixte: String(licence.echelon_mixte || '')
    };

    return licensee;
  }

  /**
   * Parse XML teams response according to FFTT xml_equipe.php format
   */
  private parseXMLTeams(xmlResponse: string): TeamData[] {
    const teams: TeamData[] = [];
    const equipeMatches = xmlResponse.match(/<equipe>[\s\S]*?<\/equipe>/g);

    if (equipeMatches) {
      equipeMatches.forEach(match => {
        const team: TeamData = {
          libequipe: this.extractTagValue(match, 'libequipe') || '',
          libdivision: this.extractTagValue(match, 'libdivision') || '',
          liendivision: this.extractTagValue(match, 'liendivision') || '',
          idepr: this.extractTagValue(match, 'idepr') || '',
          libepr: this.extractTagValue(match, 'libepr') || ''
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
    const regex = new RegExp(`<${tagName}>([^<]*)</${tagName}>`, 'i');
    const match = xmlMatch.match(regex);
    const result = match ? match[1] : null;

    // Debug for first few tags to see what's happening
    if (tagName === 'nom' || tagName === 'prenom' || tagName === 'cat') {
      console.log(`extractTagValue debug - tag: ${tagName}, found: "${result}", in XML: ${xmlMatch.substring(0, 200)}...`);
    }

    return result;
  }
}

/**
 * Fetch licensees for a club using modern FFTT API with ranking data (xml_licence_b.php)
 * Export function for use in Nuxt API routes
 */
export async function fetchLicenseesWithSmartPing(clubId: string): Promise<SmartPingResult<LicenseeData[]>> {
  const config = useRuntimeConfig();
  const appCode = config.smartpingAppCode;
  const password = config.smartpingPassword;
  const email = config.smartpingEmail;

  if (!appCode || !password || !email) {
    console.error('Missing SmartPing credentials');
    return {
      success: false,
      error: 'Missing SmartPing API credentials',
      source: 'config'
    };
  }

  try {
    const smartPingApi = new SmartPingAPI(appCode, password, email);
    const result = await smartPingApi.getClubLicenseesWithRanking(clubId);

    return {
      ...result,
      source: 'xml_licence_b'
    };

  } catch (error) {
    console.error('SmartPing API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'xml_licence_b'
    };
  }
}

/**
 * Fetch teams for a club using modern FFTT API
 * Export function for use in Nuxt API routes
 */
export async function fetchTeamsWithSmartPing(clubId: string): Promise<SmartPingResult<TeamData[]>> {
  const config = useRuntimeConfig();
  const appCode = config.smartpingAppCode;
  const password = config.smartpingPassword;
  const email = config.smartpingEmail;

  if (!appCode || !password || !email) {
    console.error('Missing SmartPing credentials');
    return {
      success: false,
      error: 'Missing SmartPing API credentials',
      source: 'config'
    };
  }

  try {
    const smartPingApi = new SmartPingAPI(appCode, password, email);
    const result = await smartPingApi.getClubTeams(clubId);

    return {
      ...result,
      source: 'smartping_api'
    };

  } catch (error) {
    console.error('SmartPing Teams API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'smartping_api'
    };
  }
}
