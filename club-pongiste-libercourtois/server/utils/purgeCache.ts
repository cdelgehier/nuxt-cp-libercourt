/**
 * Purge Netlify CDN cache by tags.
 * No-ops outside of the Netlify environment (local dev, CI).
 */
export async function purgeTags(...tags: string[]): Promise<void> {
  if (!process.env.NETLIFY) return;
  try {
    const { purgeCache } = await import("@netlify/functions");
    await purgeCache({ tags });
  } catch (e) {
    console.error("[cache] purge failed for tags:", tags, e);
  }
}
