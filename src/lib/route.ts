import { Hono } from "hono";
import type { Variables } from "./types";

/**
 * Creates an API route (Hono instance) with typed context.
 * Use c.get("ctx") and c.get("service") in handlers.
 */
export function route() {
  return new Hono<{ Variables: Variables }>();
}
