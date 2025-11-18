import type { NewsArticle, NewsResponse } from "~/types";

// Facebook Graph API response structure
interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  permalink_url: string;
  full_picture?: string;
  attachments?: {
    data: Array<{
      media?: {
        image?: {
          src: string;
        };
      };
      type: string;
      url: string;
    }>;
  };
}

interface FacebookFeedResponse {
  data: FacebookPost[];
  paging?: {
    previous?: string;
    next?: string;
  };
}

export default defineEventHandler(async (): Promise<NewsResponse> => {
  try {
    const config = useRuntimeConfig();
    const pageId = config.facebookPageId;
    const accessToken = config.facebookPageAccessToken;

    if (!pageId || !accessToken) {
      console.error("Missing Facebook credentials");
      return {
        articles: [],
        total: 0,
        source: "facebook",
        lastUpdated: new Date().toISOString(),
      };
    }

    // Fetch posts from Facebook Graph API
    const response = await $fetch<FacebookFeedResponse>(
      `https://graph.facebook.com/v24.0/${pageId}/posts`,
      {
        params: {
          access_token: accessToken,
          fields:
            "id,message,story,created_time,permalink_url,full_picture,attachments{media,type,url}",
          limit: 10,
        },
      },
    );

    const posts = response.data || [];

    // Transform Facebook posts to NewsArticle format
    const articles: NewsArticle[] = posts.map((post) => {
      // Use message if available, otherwise use story
      const fullContent = post.message || post.story || "";

      // Extract image from full_picture or attachments
      let image: string | undefined = post.full_picture;
      if (
        !image &&
        post.attachments?.data &&
        post.attachments.data.length > 0
      ) {
        const firstAttachment = post.attachments.data[0];
        image = firstAttachment.media?.image?.src || firstAttachment.url;
      }

      // Generate a title from the first line of content
      const lines = fullContent.split("\n");
      const title =
        lines[0].substring(0, 100) || "Publication Facebook du club";

      // Remove the first line from content to avoid duplication
      const content = lines.slice(1).join("\n").trim() || fullContent;

      // Description uses the content without the title
      const description = content.substring(0, 200);

      return {
        id: post.id,
        title,
        description,
        content,
        link: post.permalink_url,
        publishedAt: new Date(post.created_time),
        author: "Club Pongiste Libercourtois",
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
    console.error("Error fetching Facebook posts:", error);

    // Return empty response on error instead of throwing
    return {
      articles: [],
      total: 0,
      source: "facebook",
      lastUpdated: new Date().toISOString(),
    };
  }
});
