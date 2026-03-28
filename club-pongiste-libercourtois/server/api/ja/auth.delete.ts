const SESSION_PASSWORD =
  process.env.SESSION_SECRET ?? "fallback-change-me-in-production";

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: SESSION_PASSWORD });
  await session.clear();
  return { ok: true };
});
