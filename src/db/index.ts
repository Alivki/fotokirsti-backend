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
 */
export function createDb(connectionString: string) {
  const queryClient = postgres(connectionString);
  return drizzle(queryClient, {
    schema,
  });
}