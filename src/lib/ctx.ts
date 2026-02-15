import { createDb } from "../db";
import { env } from "./env";
import { createAuth, type AuthInstance } from "./auth/better-auth";

/**
 * Application context: external dependencies (db, auth).
 * Injected into every request via middleware for DI and testability.
 */
export interface AppContext {
  db: ReturnType<typeof createDb>;
  auth: AuthInstance;
}

/**
 * Create application context with real service instances.
 */
export async function createAppContext(): Promise<AppContext> {
  const db = createDb(env.DATABASE_URL);
  const auth = createAuth({ db });
  return { db, auth };
}

/**
 * Application services: domain logic that uses context.
 * Extend this and createAppServices when adding new services.
 */
export interface AppServices {
  // e.g. apiKey: ApiKeyService;
}

/**
 * Create application services. Add new services here as the app grows.
 */
export function createAppServices(_ctx: AppContext): AppServices {
  return {};
}
