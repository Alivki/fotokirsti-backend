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
const isProd = env.NODE_ENV === "production";

/**
 * Create fully typed Hono app
 */
const app = new Hono<{ Variables: Variables }>();

/**
 * Security headers for all responses (no cost, small security gain).
 */
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
});

/**
 * Boot everything inside async function
 * (avoids top-level await TS error)
 */
async function bootstrap() {
  const ctx: AppContext = await createAppContext();
  const services: AppServices = createAppServices(ctx);

  // Request logging: skip in production to reduce log volume and cost
  if (!isProd) {
    app.use("*", logger());
  }

  // Attach DI context
  app.use("*", async (c, next) => {
    c.set("ctx", ctx);
    c.set("service", services);
    await next();
  });

  // Global CORS (include PATCH for batch-publish)
  app.use(
    "*",
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "Accept"],
    }),
  );

  app.all("/api/auth/*", async (c) => {
    const auth = c.get("ctx").auth;
    return auth.handler(c.req.raw);
  });

  // Protected routes: require auth except for auth, health, and public GETs
  app.use("/api/*", async (c, next) => {
    if (c.req.path.startsWith("/api/auth")) return next();

    const publicPaths = ["/api/health", "/api/photos", "/api/pricelist"];
    if (publicPaths.some((p) => c.req.path === p && c.req.method === "GET")) {
      return next();
    }

    return requireAuth(c as unknown as Parameters<typeof requireAuth>[0], next);
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

  Bun.serve({
    port,
    hostname: "0.0.0.0",
    fetch: app.fetch,
  });

  if (!isProd) {
    console.log(`🔥 Fotokirsti Backend: http://localhost:${port}/api`);
  }
}

bootstrap();
