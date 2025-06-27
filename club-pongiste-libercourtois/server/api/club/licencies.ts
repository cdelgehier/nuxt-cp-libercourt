interface ClubInfo {
  licencies: number;
  lastUpdate: string;
  source: string;
}

export default defineEventHandler(async (): Promise<ClubInfo> => {
  try {
    // Fetch data from PingPocket website
    const response = await $fetch<string>(
      "https://www.pingpocket.fr/app/fftt/clubs/07620112",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Club-Libercourtois-Bot/1.0)",
        },
      },
    );

    // Extract number of licencies from HTML using regex
    const licenciesMatch = response.match(/n° \d+ - (\d+) licenciés/);
    const licencies = licenciesMatch ? parseInt(licenciesMatch[1], 10) : 78;

    return {
      licencies,
      lastUpdate: new Date().toISOString(),
      source: "PingPocket FFTT",
    };
  } catch (error) {
    console.error("Error fetching licencies data:", error);

    // Return fallback data if scraping fails
    return {
      licencies: 78,
      lastUpdate: new Date().toISOString(),
      source: "Fallback data",
    };
  }
});
