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

  app.use("*", logger());

  // Attach DI context
  app.use("*", async (c, next) => {
    c.set("ctx", ctx);
    c.set("service", services);
    await next();
  });

  // Single CORS system
  app.use(
      "*",
      cors({
        origin: env.FRONTEND_URL,
        credentials: true,
      })
  );

  /**
   * -------------------
   * Better Auth Mount
   * -------------------
   */
  app.all("/api/auth/*", async (c) => {
    const { auth } = c.get("ctx");

    const response = await auth.handler(c.req.raw);

    // Manually decorate Better Auth response
    response.headers.set("Access-Control-Allow-Origin", env.FRONTEND_URL);
    response.headers.set("Access-Control-Allow-Credentials", "true");

    return response;
  });

  /**
   * -------------------
   * Protected Routes
   * -------------------
   */
  app.use("/api/*", requireAuth);
  app.route("/api", protectedRoutes);

  /**
   * -------------------
   * Public Routes
   * -------------------
   */
  app.route("/api", publicRoutes);

  app.get("/", (c) => c.text("OK"));

  app.onError((err, c) => {
    const res = globalErrorHandler(err, c);
    res.headers.set("Access-Control-Allow-Origin", env.FRONTEND_URL);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    return res;
  });

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

  console.log(`🔥 Server running on port ${port}`);
}

bootstrap();
