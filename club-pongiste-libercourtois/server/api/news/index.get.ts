import type { NewsResponse } from "~/types";

export default defineEventHandler(async (event): Promise<NewsResponse> => {
  try {
    // Get limit from query params (default: 10)
    const query = getQuery(event);
    const limit = query.limit ? parseInt(query.limit as string, 10) : 10;

    // Fetch all three sources in parallel for better performance
    const [comiteResponse, ligueResponse, facebookResponse] = await Promise.all(
      [
        $fetch<NewsResponse>("/api/news/comite"),
        $fetch<NewsResponse>("/api/news/ligue"),
        $fetch<NewsResponse>("/api/news/facebook"),
      ],
    );

    // Combine all articles from all sources
    const allArticles = [
      ...comiteResponse.articles,
      ...ligueResponse.articles,
      ...facebookResponse.articles,
    ];

    // Sort by publication date (most recent first)
    allArticles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    // Apply limit
    const limitedArticles = allArticles.slice(0, limit);

    return {
      articles: limitedArticles,
      total: limitedArticles.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching combined news:", error);

    // Return empty response on error
    return {
      articles: [],
      total: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
});
