import { spawn } from "child_process";
import type { Licensee } from "~/types";

// SmartPing API integration with Python backend
interface PythonScriptResult {
  success: boolean;
  licensees: any[];
  source: "smartping" | "pingpocket_html" | "mock";
  error?: string;
}

// Helper function to determine category from age and level
function getCategoryFromEchelon(
  echelon: string,
  points: number,
): Licensee["category"] {
  const echelonUpper = echelon.toUpperCase();

  if (echelonUpper.includes("POU")) return "poussin";
  if (echelonUpper.includes("BEN")) return "benjamin";
  if (echelonUpper.includes("MIN")) return "minime";
  if (echelonUpper.includes("CAD")) return "cadet";
  if (echelonUpper.includes("JUN")) return "junior";
  if (echelonUpper.includes("SEN")) return "senior";
  if (echelonUpper.includes("VET")) return "veteran";

  // Default based on points
  if (points < 500) return "benjamin";
  if (points < 800) return "minime";
  if (points < 1200) return "senior";
  return "veteran";
}

// Estimate age from category (rough approximation)
function estimateAgeFromCategory(category: Licensee["category"]): number {
  const ageMap: Record<Licensee["category"], number> = {
    poussin: 8,
    benjamin: 10,
    minime: 13,
    cadet: 16,
    junior: 17,
    senior: 25,
    veteran: 50,
    surclasse: 65,
  };
  return ageMap[category] || 25;
}

// Convert SmartPing data to Nuxt format
function convertSmartPingToNuxtFormat(smartPingData: any): Licensee {
  const category = getCategoryFromEchelon(
    smartPingData.echelon || "",
    smartPingData.points || 0,
  );
  const age = estimateAgeFromCategory(category);

  return {
    id:
      smartPingData.licence ||
      smartPingData.licenseNumber ||
      `gen_${Date.now()}`,
    firstName: smartPingData.prenom || smartPingData.firstName || "",
    lastName: smartPingData.nom || smartPingData.lastName || "",
    licenseNumber: smartPingData.licence || smartPingData.licenseNumber || "",
    age,
    category,
    email: undefined, // Not provided by FFTT API
    phone: undefined, // Not provided by FFTT API
    active: smartPingData.valide
      ? smartPingData.valide.toUpperCase() === "O"
      : true,
  };
}

// Execute Python script to fetch licensees
async function executePythonScript(
  clubId: string,
  apiKey?: string,
): Promise<PythonScriptResult> {
  return new Promise((resolve) => {
    const scriptPath = "scripts/fftt_smartping_api.py";
    const args = [scriptPath, clubId];

    if (apiKey) {
      args.push(apiKey);
    }

    const pythonProcess = spawn("python3", args, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          // Try to parse JSON output from Python script
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (_error) {
          // If not JSON, assume it's log output and return empty result
          resolve({
            success: false,
            licensees: [],
            source: "mock",
            error: "Failed to parse Python script output",
          });
        }
      } else {
        resolve({
          success: false,
          licensees: [],
          source: "mock",
          error: stderr || `Python script exited with code ${code}`,
        });
      }
    });

    pythonProcess.on("error", (_error) => {
      resolve({
        success: false,
        licensees: [],
        source: "mock",
        error: `Failed to execute Python script: ${_error.message}`,
      });
    });
  });
}

// Main function to fetch licensees with SmartPing integration
export async function fetchLicenseesWithSmartPing(clubId: string): Promise<{
  success: boolean;
  licensees: Licensee[];
  count: number;
  source: string;
  message: string;
}> {
  try {
    // First try to get API key from environment
    const smartPingApiKey = process.env.SMARTPING_API_KEY;

    console.log(`Attempting to fetch licensees for club ${clubId}`);

    if (smartPingApiKey) {
      console.log("SmartPing API key found, trying official API...");

      const result = await executePythonScript(clubId, smartPingApiKey);

      if (result.success && result.licensees.length > 0) {
        const licensees = result.licensees.map(convertSmartPingToNuxtFormat);

        return {
          success: true,
          licensees,
          count: licensees.length,
          source: "smartping",
          message: `${licensees.length} licenciés récupérés depuis l'API SmartPing officielle`,
        };
      }
    }

    // Fallback to HTML parsing if API fails or no API key
    console.log("Trying HTML parsing fallback...");

    const htmlResult = await executePythonScript(clubId);

    if (htmlResult.success && htmlResult.licensees.length > 0) {
      const licensees = htmlResult.licensees.map(convertSmartPingToNuxtFormat);

      return {
        success: true,
        licensees,
        count: licensees.length,
        source: "pingpocket_html",
        message: `${licensees.length} licenciés récupérés depuis PingPocket (HTML)`,
      };
    }

    // Final fallback to mock data
    console.log("Using mock data as final fallback...");

    const mockLicensees: Licensee[] = [
      {
        id: "2051001",
        firstName: "Thomas",
        lastName: "MARTIN",
        licenseNumber: "2051001",
        age: 14,
        category: "minime",
        email: "thomas.martin@email.com",
        phone: "0612345678",
        active: true,
      },
      {
        id: "2051002",
        firstName: "Julie",
        lastName: "DUBOIS",
        licenseNumber: "2051002",
        age: 16,
        category: "cadet",
        email: "julie.dubois@email.com",
        phone: "0623456789",
        active: true,
      },
      {
        id: "2051003",
        firstName: "Pierre",
        lastName: "LEROY",
        licenseNumber: "2051003",
        age: 28,
        category: "senior",
        email: "pierre.leroy@email.com",
        phone: "0634567890",
        active: true,
      },
      // ... other test licensees
    ];

    return {
      success: true,
      licensees: mockLicensees,
      count: mockLicensees.length,
      source: "mock",
      message: "Données de test utilisées (APIs externes non disponibles)",
    };
  } catch (error) {
    console.error("Error in fetchLicenseesWithSmartPing:", error);

    return {
      success: false,
      licensees: [],
      count: 0,
      source: "error",
      message: "Erreur lors de la récupération des licenciés",
    };
  }
}
