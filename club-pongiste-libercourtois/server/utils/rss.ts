import { XMLParser } from "fast-xml-parser";
import type { NewsArticle, NewsResponse } from "~/types";

// RSS item structure from WordPress feeds
interface RSSItem {
  title: string;
  link: string;
  "dc:creator"?: string;
  pubDate: string;
  category?: string | string[];
  guid: string;
  description: string;
  "content:encoded"?: string;
}

// Extract first image URL from HTML content
function extractImageFromHtml(html: string): string | undefined {
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : undefined;
}

// Clean HTML tags from description
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Fetch and parse a WordPress RSS feed
 */
export async function fetchRssFeed(
  url: string,
  source: "comite" | "ligue",
  defaultAuthor: string,
): Promise<NewsResponse> {
  try {
    // Fetch RSS feed
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent": "Club-Pongiste-Libercourtois/1.0",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    const response = await fetchResponse.text();

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: true,
      trimValues: true,
      isArray: (name) => name === "item",
    });

    const result = parser.parse(response);

    // Check if RSS structure is valid
    if (!result?.rss?.channel?.item) {
      console.error(`Invalid RSS structure from ${source}`, {
        hasRss: !!result?.rss,
        hasChannel: !!result?.rss?.channel,
        hasItem: !!result?.rss?.channel?.item,
        channelKeys: result?.rss?.channel
          ? Object.keys(result.rss.channel)
          : [],
      });
      return {
        articles: [],
        total: 0,
        source,
        lastUpdated: new Date().toISOString(),
      };
    }

    const items: RSSItem[] = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];

    // Transform RSS items to NewsArticle format
    const articles: NewsArticle[] = items.map((item: RSSItem) => {
      const categories = Array.isArray(item.category)
        ? item.category
        : item.category
          ? [item.category]
          : [];

      const content = item["content:encoded"] || item.description;
      const image = extractImageFromHtml(content);
      const description = stripHtml(item.description);

      return {
        id: item.guid,
        title: item.title,
        description,
        content,
        link: item.link,
        publishedAt: new Date(item.pubDate),
        author: item["dc:creator"] || defaultAuthor,
        categories,
        image,
        source,
      };
    });

    return {
      articles,
      total: articles.length,
      source,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching ${source} RSS feed:`, error);

    return {
      articles: [],
      total: 0,
      source,
      lastUpdated: new Date().toISOString(),
    };
  }
}
