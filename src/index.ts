import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { env } from "./lib/env";
import {
  createAppContext,
  createAppServices,
  type AppContext,
  type AppServices,
} from "./lib/ctx";

import type { Variables } from "./lib/types";
import { requireAuth } from "./middleware/auth";
import publicRoutes from "./routes/public";
import protectedRoutes from "./routes/protected";
import { globalErrorHandler, notFoundHandler } from "./lib/errors";

const port = Number(process.env.PORT) || 4000;

/**
 * Create fully typed Hono app
 */
const app = new Hono<{ Variables: Variables }>();

/**
 * Boot everything inside async function
 * (avoids top-level await TS error)
 */
async function bootstrap() {
  const ctx: AppContext = await createAppContext();
  const services: AppServices = createAppServices(ctx);

  // Logger
  app.use("*", logger());

  // Attach DI context
  app.use("*", async (c, next) => {
    c.set("ctx", ctx);
    c.set("service", services);
    await next();
  });

  // Global CORS
  app.use(
      "*",
      cors({
        origin: env.FRONTEND_URL,
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization", "Accept", "Origin"], // Added Origin/Accept
      })
  );

  app.all("/api/auth/*", async (c) => {
    const auth = c.get("ctx").auth;
    return auth.handler(c.req.raw);
  });

  // Protected routes first so /api/photos/admin matches before /api/photos/:id
  app.use("/api/*", async (c, next) => {
    if (c.req.path.startsWith("/api/auth")) return next();

    const publicPaths = ["/api/health", "/api/photos", "/api/pricelist"];
    if (publicPaths.some(p => c.req.path === p && c.req.method === 'GET')) {
      return next();
    }

    // Use 'as any' to bypass the complex Hono Context type mismatch
    return (requireAuth as any)(c, next);
  });

  app.route("/api", protectedRoutes);
  app.route("/api", publicRoutes);

  // Root health check
  app.get("/", (c) => c.text("OK"));

  // Error handling with CORS
  app.onError((err, c) => {
    const res = globalErrorHandler(err, c);
    res.headers.set("Access-Control-Allow-Origin", env.FRONTEND_URL);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    return res;
  });

  // Not found handling with CORS
  app.notFound((c) => {
    const res = notFoundHandler(c);
    res.headers.set("Access-Control-Allow-Origin", env.FRONTEND_URL);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    return res;
  });

  // Start Bun server
  Bun.serve({
    port,
    hostname: "0.0.0.0",
    fetch: app.fetch,
  });

  console.log(`🔥 Server running on port ${port}`);
}

bootstrap();
