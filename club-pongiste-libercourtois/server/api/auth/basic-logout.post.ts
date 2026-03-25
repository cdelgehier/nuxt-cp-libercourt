export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET ?? "fallback-change-me-in-production",
  });
  await session.clear();
  return { ok: true };
});
