import { createMiddleware } from "hono/factory";
import { HTTPAppException } from "../lib/errors";
import type { AuthEnv, AuthVariables, Variables } from "../lib/types";

/**
 * Requires that the user is authenticated.
 * Sets `user` and `session` on context; throws HTTPAppException.Unauthorized() if no session.
 */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const { auth } = c.get("ctx");
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw HTTPAppException.Unauthorized();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

/** Variables with optional user/session (set by captureAuth when a session exists). */
type VariablesWithOptionalAuth = {
  Variables: Variables & Partial<Pick<AuthVariables, "user" | "session">>;
};

/**
 * Optional auth: if the user has a session, sets `user` and `session` on context.
 * Does not block unauthenticated requests; handlers can use c.get("user") when present.
 */
export const captureAuth = createMiddleware<VariablesWithOptionalAuth>(async (c, next) => {
  const { auth } = c.get("ctx");
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  }
  await next();
});
