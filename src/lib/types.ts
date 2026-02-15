import type { AppContext, AppServices } from "./ctx";
import type { AuthInstance } from "./auth/better-auth";

/**
 * Hono context variables: available in every request after middleware.
 */
export type Variables = {
  ctx: AppContext;
  service: AppServices;
};

/**
 * Extended variables for protected routes: includes user and session.
 */
export type AuthVariables = Variables & {
  user: AuthInstance["$Infer"]["Session"]["user"];
  session: AuthInstance["$Infer"]["Session"]["session"];
};

export type Env = {
  Variables: Variables;
};

export type AuthEnv = {
  Variables: AuthVariables;
};
