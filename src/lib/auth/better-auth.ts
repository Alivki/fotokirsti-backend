import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt, username } from "better-auth/plugins";
import * as schema from "../../db/schema/auth";
import { env } from "../env";
import type { createDb } from "../../db";

/**
 * Create Better Auth instance with database and config from env.
 * Auth is created in createAppContext and attached to ctx.
 */
export function createAuth(ctx: { db: ReturnType<typeof createDb> }) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.FRONTEND_URL],
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(ctx.db, {
      provider: "pg",
      schema: { ...schema },
    }),
    session: {
      strategy: "jwt",
      expiryAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      cookies: {
        sessionToken: { attributes: { secure: true, httpOnly: true, sameSite: "none" } },
        sessionData: { attributes: { secure: true, httpOnly: true, sameSite: "none" } },
        csrfToken: { attributes: { secure: true, httpOnly: true, sameSite: "none" } },
      },
      crossSilo: true,
    },
    emailAndPassword: {
      enabled: true,
    },
    plugins: [username(), jwt()],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
