import type { NewsResponse } from "~/types";

export default defineEventHandler(async (): Promise<NewsResponse> => {
  return await fetchRssFeed("https://cd62tt.blog/feed/", "comite", "CD62TT");
});
