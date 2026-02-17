import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as authSchema from "./schema/auth";
import * as photoSchema from "./schema/photo";
import * as priceSchema from "./schema/priceList";

export const schema = {
  ...authSchema,
  ...photoSchema,
  ...priceSchema,
};

export type DbSchema = typeof schema;

/**
 * Create a database client for dependency injection.
 * Used by createAppContext(); do not use the default db in app code.
 *
 * Connection options reduce ECONNRESET on Railway: shorter timeouts and
 * connection recycling so idle/stale connections are replaced before the peer resets them.
 */
export function createDb(connectionString: string) {
  const queryClient = postgres(connectionString, {
    max: 5, // keep low for Railway (smaller plans have limited DB connections)
    idle_timeout: 60,
    connect_timeout: 10,
    max_lifetime: 60 * 30, // 30 minutes
    keep_alive: 30, // reduces ECONNRESET from idle connection drops
  });
  return drizzle(queryClient, {
    schema,
  });
}