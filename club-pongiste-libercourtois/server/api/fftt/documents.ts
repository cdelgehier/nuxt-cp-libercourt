import { z } from "zod";

// Schema de validation pour les documents FFTT
const FFTTDocumentSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  lastUpdated: z.string(),
});

const FFTTDocumentsSchema = z.object({
  bordereau_licence: FFTTDocumentSchema.optional(),
  questionnaire_majeurs: FFTTDocumentSchema.optional(),
  questionnaire_mineurs: FFTTDocumentSchema.optional(),
  certificat_medical: FFTTDocumentSchema.optional(),
  lastScrape: z.string(),
  success: z.boolean(),
});

type FFTTDocuments = z.infer<typeof FFTTDocumentsSchema>;

// Cache to avoid scraping too often (1 hour)
let cachedDocuments: FFTTDocuments | null = null;
let lastScrapeTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

export default defineEventHandler(async (_event) => {
  try {
    const now = Date.now();

    // Use cache if available and recent
    if (cachedDocuments && now - lastScrapeTime < CACHE_DURATION) {
      return cachedDocuments;
    }

    // FFTT download page URL
    const ffttUrl =
      "https://www.fftt.com/doc/administratif/telechargement.html";

    const response = await fetch(ffttUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ClubBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch FFTT page: ${response.status}`);
    }

    const html = await response.text();

    // Search for links with specific patterns
    const documents: Partial<FFTTDocuments> = {
      lastScrape: new Date().toISOString(),
      success: false,
    };

    // Search patterns for different documents (based on real URLs)
    const patterns = {
      bordereau_licence: [
        /25-2-licence\.pdf/i,
        /bordereau.*licence.*comp[eé]tition/i,
        /bordereau.*licence.*loisir/i,
        /licence.*comp[eé]tition.*loisir/i,
        /demande.*licence.*comp[eé]tition/i,
        /demande.*licence.*loisir/i,
        /bordereau.*demande.*licence/i,
        /^licence$/i, // Texte court "licence"
      ],
      questionnaire_majeurs: [
        /25-10-1-autoquestionnaire-medical-majeur\.pdf/i,
        /autoquestionnaire.*medical.*majeur/i,
        /questionnaire.*m[eé]dical.*majeur/i,
        /auto.*questionnaire.*majeur/i,
        /questionnaire.*adulte/i,
        /questionnaire.*\+.*18/i,
        /majeur.*questionnaire/i,
        /medical.*majeur/i,
      ],
      questionnaire_mineurs: [
        /25-10-2-autoquestionnaire-medical-mineur\.pdf/i,
        /autoquestionnaire.*medical.*mineur/i,
        /questionnaire.*m[eé]dical.*mineur/i,
        /auto.*questionnaire.*mineur/i,
        /questionnaire.*jeune/i,
        /questionnaire.*-.*18/i,
        /mineur.*questionnaire/i,
        /medical.*mineur/i,
      ],
      certificat_medical: [
        /25-9-certificat\.pdf/i,
        /certificat.*m[eé]dical.*tennis.*table/i,
        /certificat.*m[eé]dical.*ping.*pong/i,
        /certificat.*m[eé]dical.*sport/i,
        /certificat.*m[eé]dical.*pratique/i,
        /certificat.*m[eé]dical.*fftt/i,
        /certificat.*medical/i,
        /^certificat$/i, // Texte court "certificat"
      ],
    };

    // Function to clean and build complete URL
    function cleanUrl(url: string): string {
      let fullUrl = url;

      // Si l'URL commence par un slash, ajouter le domaine FFTT complet
      if (url.startsWith("/")) {
        fullUrl = `https://www.fftt.com${url}`;
      }
      // If URL doesn't start with http, build complete URL
      else if (!url.startsWith("http")) {
        // If URL already contains 'doc/administratif', don't duplicate path
        if (url.includes("doc/administratif") || url.startsWith("doc/")) {
          fullUrl = `https://www.fftt.com/${url}`;
        } else {
          // Otherwise, add complete path only if not already present
          fullUrl = `https://www.fftt.com/doc/administratif/documents/${url}`;
        }
      }

      // Clean double slashes and duplicate paths
      fullUrl = fullUrl.replace(/([^:]\/)\/+/g, "$1");
      fullUrl = fullUrl.replace(
        "/doc/administratif/documents/./documents/",
        "/doc/administratif/documents/",
      );
      fullUrl = fullUrl.replace("/documents/documents/", "/documents/");

      return fullUrl;
    }

    // URLs directes connues pour 2025 (fallback si le scraping ne trouve pas tout)
    const knownUrls = {
      bordereau_licence:
        "https://www.fftt.com/doc/administratif/documents/25-2-licence.pdf",
      questionnaire_majeurs:
        "https://www.fftt.com/doc/administratif/documents/25-10-1-autoquestionnaire-medical-majeur.pdf",
      questionnaire_mineurs:
        "https://www.fftt.com/doc/administratif/documents/25-10-2-autoquestionnaire-medical-mineur.pdf",
      certificat_medical:
        "https://www.fftt.com/doc/administratif/documents/25-9-certificat.pdf",
    };

    // Extract PDF links with improved regex
    const linkRegex = /<a[^>]+href=["']([^"']+\.pdf)["'][^>]*>([^<]+)</gi;
    const altLinkRegex =
      /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*(?:pdf|PDF|bordereau|questionnaire|certificat|licence|medical)[^<]*)</gi;

    let match;

    // First pass: direct search by known URL in HTML
    for (const [docType, knownUrl] of Object.entries(knownUrls)) {
      if (
        html.includes(knownUrl) ||
        html.includes(knownUrl.replace("https://www.fftt.com", ""))
      ) {
        // Extraire le nom du document depuis le HTML si possible
        const urlPattern = knownUrl
          .replace("https://www.fftt.com", "")
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const nameRegex = new RegExp(
          `<a[^>]+href=["'][^"']*${urlPattern}["'][^>]*>([^<]+)</`,
          "i",
        );
        const nameMatch = html.match(nameRegex);

        documents[docType as keyof typeof knownUrls] = {
          name: nameMatch ? nameMatch[1].trim() : getDefaultName(docType),
          url: knownUrl,
          lastUpdated: new Date().toISOString(),
        };
      }
    }

    // Second pass: direct PDF links with patterns
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const linkText = match[2].trim();

      // Build complete URL if necessary
      const fullUrl = cleanUrl(url);

      // Check each document type
      for (const [docType, docPatterns] of Object.entries(patterns)) {
        if (
          !documents[docType as keyof typeof patterns] &&
          (docPatterns.some((pattern) => pattern.test(linkText)) ||
            docPatterns.some((pattern) => pattern.test(url)))
        ) {
          documents[docType as keyof typeof patterns] = {
            name: linkText,
            url: fullUrl,
            lastUpdated: new Date().toISOString(),
          };
          break;
        }
      }
    }

    // Third pass: links with keywords in text
    html.replace(altLinkRegex, (fullMatch, url, linkText) => {
      const cleanText = linkText.trim();

      // Build complete URL if necessary
      const fullUrl = cleanUrl(url);

      // Check if not already found
      for (const [docType, docPatterns] of Object.entries(patterns)) {
        if (
          !documents[docType as keyof typeof patterns] &&
          docPatterns.some((pattern) => pattern.test(cleanText))
        ) {
          documents[docType as keyof typeof patterns] = {
            name: cleanText,
            url: fullUrl,
            lastUpdated: new Date().toISOString(),
          };
          break;
        }
      }
      return fullMatch;
    });

    // Function to get default name
    function getDefaultName(docType: string): string {
      const defaultNames: Record<string, string> = {
        bordereau_licence:
          "Bordereau de demande de Licence (Compétition / Loisir)",
        questionnaire_majeurs: "Autoquestionnaire Médical (Personnes Majeures)",
        questionnaire_mineurs: "Autoquestionnaire Médical (Personnes Mineures)",
        certificat_medical:
          "Certificat Médical pour la pratique du tennis de table",
      };
      return defaultNames[docType] || docType;
    }

    // Check if at least one document was found
    const foundDocuments = Object.keys(documents).filter(
      (key) =>
        key !== "lastScrape" &&
        key !== "success" &&
        documents[key as keyof typeof documents],
    ).length;

    documents.success = foundDocuments > 0;

    // Validation avec Zod
    const validatedDocuments = FFTTDocumentsSchema.parse(documents);

    // Update cache
    cachedDocuments = validatedDocuments;
    lastScrapeTime = now;

    return validatedDocuments;
  } catch (error) {
    console.error("Error scraping FFTT documents:", error);

    // Return cache data if available, otherwise error response
    if (cachedDocuments) {
      return cachedDocuments;
    }

    const fallbackResponse: FFTTDocuments = {
      lastScrape: new Date().toISOString(),
      success: false,
    };

    return fallbackResponse;
  }
});
