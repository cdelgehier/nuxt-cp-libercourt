import { compare } from "bcryptjs";

export default defineEventHandler(async (event) => {
  const { password } = await readBody<{ password: string }>(event);

  const expectedUser = process.env.ADMIN_BASIC_AUTH_USER ?? "admin";
  const expectedHash = process.env.ADMIN_BASIC_AUTH_HASH ?? "";

  if (!expectedHash)
    throw createError({
      statusCode: 503,
      message: "Basic Auth non configuré (ADMIN_BASIC_AUTH_HASH manquant)",
    });

  if (!password)
    throw createError({ statusCode: 400, message: "Mot de passe requis" });

  const valid = await compare(password, expectedHash);
  if (!valid)
    throw createError({ statusCode: 401, message: "Mot de passe incorrect" });

  const session = await useSession(event, {
    password: process.env.SESSION_SECRET ?? "fallback-change-me-in-production",
  });
  await session.update({ user: expectedUser, method: "basic" });

  return { ok: true };
});
