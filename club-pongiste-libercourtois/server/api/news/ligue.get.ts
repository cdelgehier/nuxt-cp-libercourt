import type { NewsResponse } from "~/types";

export default defineEventHandler(async (): Promise<NewsResponse> => {
  return await fetchRssFeed(
    "https://liguehdftt.fr/feed/",
    "ligue",
    "Ligue HDF TT",
  );
});
