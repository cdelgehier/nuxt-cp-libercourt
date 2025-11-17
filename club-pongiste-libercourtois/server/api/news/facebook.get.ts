import type { NewsArticle, NewsResponse } from "~/types";

// JSON Feed 1.1 structure from RSS.app
interface JSONFeed {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  items: JSONFeedItem[];
}

interface JSONFeedItem {
  id: string;
  url: string;
  title: string;
  content_text: string;
  content_html: string;
  date_published: string;
  authors: Array<{ name: string }>;
  image?: string;
  attachments?: Array<{
    url: string;
    mime_type: string;
  }>;
}

// Extract first image from attachments or content
function extractImage(item: JSONFeedItem): string | undefined {
  if (item.image) return item.image;
  if (item.attachments && item.attachments.length > 0) {
    return item.attachments[0].url;
  }
  const imgMatch = item.content_html.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : undefined;
}

export default defineEventHandler(async (): Promise<NewsResponse> => {
  try {
    // Fetch JSON feed from RSS.app (Facebook posts)
    const feed = await $fetch<JSONFeed>(
      "https://rss.app/feeds/v1.1/iRBobncaBBXgPC5v.json",
      {
        headers: {
          "User-Agent": "Club-Pongiste-Libercourtois/1.0",
        },
      },
    );

    const items = feed.items || [];

    // Transform JSON feed items to NewsArticle format
    const articles: NewsArticle[] = items.map((item) => {
      const author =
        item.authors && item.authors.length > 0
          ? item.authors[0].name
          : "Club Pongiste Libercourtois";

      const image = extractImage(item);

      return {
        id: item.id,
        title: item.title,
        description: item.content_text,
        content: item.content_html,
        link: item.url,
        publishedAt: new Date(item.date_published),
        author,
        categories: ["Facebook"],
        image,
        source: "facebook" as const,
      };
    });

    return {
      articles,
      total: articles.length,
      source: "facebook",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Facebook RSS feed:", error);

    // Return empty response on error instead of throwing
    return {
      articles: [],
      total: 0,
      source: "facebook",
      lastUpdated: new Date().toISOString(),
    };
  }
});
