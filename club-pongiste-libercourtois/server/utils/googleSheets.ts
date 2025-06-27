import { google } from "googleapis";

// Configuration Google Sheets
const GOOGLE_SHEETS_CONFIG = {
  // These values will be configured via environment variables
  CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "",
  PRIVATE_KEY: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  ),
  SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "",
  SHEET_NAME: "Inscriptions", // Nom de la feuille pour les inscriptions
};

// Interface for registration data
export interface RegistrationData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number;
  level?: string;
  licenseNumber?: string;
  comments?: string;
  registrationDate: string;
  status: string;
  registrationId: string;
}

// Service Google Sheets
class GoogleSheetsService {
  private sheets: any;
  private auth: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Configuration de l'authentification avec le compte de service
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: GOOGLE_SHEETS_CONFIG.CLIENT_EMAIL,
          private_key: GOOGLE_SHEETS_CONFIG.PRIVATE_KEY,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth: this.auth });
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Google Sheets:", error);
      throw error;
    }
  }

  async ensureSheetExists(): Promise<void> {
    try {
      // Check if sheet exists
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        (sheet: any) =>
          sheet.properties.title === GOOGLE_SHEETS_CONFIG.SHEET_NAME,
      );

      if (!sheetExists) {
        // Create sheet if it doesn't exist
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: GOOGLE_SHEETS_CONFIG.SHEET_NAME,
                  },
                },
              },
            ],
          },
        });

        // Add headers
        await this.addHeaders();
      } else {
        // Check if headers exist
        const headerRange = `${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!A1:P1`;
        const headerResponse = await this.sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
          range: headerRange,
        });

        if (
          !headerResponse.data.values ||
          headerResponse.data.values.length === 0
        ) {
          await this.addHeaders();
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification/création de la feuille:",
        error,
      );
      throw error;
    }
  }

  private async addHeaders(): Promise<void> {
    const headers = [
      "ID Inscription",
      "ID Événement",
      "Titre Événement",
      "Date Événement",
      "Prénom",
      "Nom",
      "Email",
      "Téléphone",
      "Âge",
      "Niveau",
      "Numéro de licence",
      "Commentaires",
      "Date d'inscription",
      "Statut",
      "Date de création",
      "Dernière modification",
    ];

    const range = `${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!A1:P1`;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });

    // Format headers (bold)
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0, // Will be updated dynamically
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                  },
                  backgroundColor: {
                    red: 0.9,
                    green: 0.9,
                    blue: 0.9,
                  },
                },
              },
              fields: "userEnteredFormat(textFormat,backgroundColor)",
            },
          },
        ],
      },
    });
  }

  async addRegistration(registration: RegistrationData): Promise<boolean> {
    try {
      await this.ensureSheetExists();

      const currentDate = new Date().toISOString();

      const values = [
        registration.registrationId,
        registration.eventId,
        registration.eventTitle,
        registration.eventDate,
        registration.firstName,
        registration.lastName,
        registration.email,
        registration.phone,
        registration.age?.toString() || "",
        registration.level || "",
        registration.licenseNumber || "",
        registration.comments || "",
        registration.registrationDate,
        registration.status,
        currentDate,
        currentDate,
      ];

      const range = `${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!A:P`;

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
        range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [values],
        },
      });

      return true;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'inscription:", error);
      return false;
    }
  }

  async getRegistrations(eventId?: string): Promise<RegistrationData[]> {
    try {
      const range = `${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!A2:P`;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
        range,
      });

      if (!response.data.values) {
        return [];
      }

      const registrations: RegistrationData[] = response.data.values.map(
        (row: string[]) => ({
          registrationId: row[0] || "",
          eventId: row[1] || "",
          eventTitle: row[2] || "",
          eventDate: row[3] || "",
          firstName: row[4] || "",
          lastName: row[5] || "",
          email: row[6] || "",
          phone: row[7] || "",
          age: row[8] ? parseInt(row[8]) : undefined,
          level: row[9] || undefined,
          licenseNumber: row[10] || undefined,
          comments: row[11] || undefined,
          registrationDate: row[12] || "",
          status: row[13] || "pending",
        }),
      );

      // Filter by eventId if specified
      if (eventId) {
        return registrations.filter((reg) => reg.eventId === eventId);
      }

      return registrations;
    } catch (error) {
      console.error("Erreur lors de la récupération des inscriptions:", error);
      return [];
    }
  }

  async updateRegistrationStatus(
    registrationId: string,
    status: string,
  ): Promise<boolean> {
    try {
      // Find row matching the registration
      const registrations = await this.getRegistrations();
      const registrationIndex = registrations.findIndex(
        (reg) => reg.registrationId === registrationId,
      );

      if (registrationIndex === -1) {
        return false;
      }

      // Update status (column N, index 13) and modification date (column P, index 15)
      const rowIndex = registrationIndex + 2; // +1 for headers, +1 because indexes start at 1
      const currentDate = new Date().toISOString();

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
        requestBody: {
          valueInputOption: "RAW",
          data: [
            {
              range: `${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!N${rowIndex}`,
              values: [[status]],
            },
            {
              range: `${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!P${rowIndex}`,
              values: [[currentDate]],
            },
          ],
        },
      });

      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      return false;
    }
  }

  async getRegistrationStats(eventId?: string): Promise<{
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  }> {
    try {
      const registrations = await this.getRegistrations(eventId);

      return {
        total: registrations.length,
        confirmed: registrations.filter((reg) => reg.status === "confirmed")
          .length,
        pending: registrations.filter((reg) => reg.status === "pending").length,
        cancelled: registrations.filter((reg) => reg.status === "cancelled")
          .length,
      };
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques:", error);
      return { total: 0, confirmed: 0, pending: 0, cancelled: 0 };
    }
  }
}

// Instance singleton
let googleSheetsService: GoogleSheetsService | null = null;

export function getGoogleSheetsService(): GoogleSheetsService {
  if (!googleSheetsService) {
    googleSheetsService = new GoogleSheetsService();
  }
  return googleSheetsService;
}

// Utility function to check if Google Sheets is configured
export function isGoogleSheetsConfigured(): boolean {
  return !!(
    GOOGLE_SHEETS_CONFIG.CLIENT_EMAIL &&
    GOOGLE_SHEETS_CONFIG.PRIVATE_KEY &&
    GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID
  );
}
