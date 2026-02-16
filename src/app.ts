import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import {
  type AppContext,
  type AppServices,
  createAppContext,
  createAppServices,
} from "./lib/ctx";
import type { Variables } from "./lib/types";
import { env } from "./lib/env";
import { globalErrorHandler, notFoundHandler } from "./lib/errors";
import publicRoutes from "./routes/public";
import protectedRoutes from "./routes/protected";
import { requireAuth } from "./middleware/auth";
import { startBackgroundJobs } from "./lib/jobs";

function getCorsHeaders(origin: string): Record<string, string> {
  const o = origin.trim();
  const allowOrigin = o.startsWith("http") ? o : o ? `https://${o}` : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function createApp(variables?: { ctx: AppContext; service: AppServices }) {
  let ctx: AppContext;
  let service: AppServices;
  if (variables) {
    ctx = variables.ctx;
    service = variables.service;
  } else {
    ctx = await createAppContext();
    service = createAppServices(ctx);
    startBackgroundJobs(ctx);
  }

  const protectedApp = new Hono<{ Variables: Variables }>()
    .use("*", requireAuth)
    .route("/", protectedRoutes);

  const api = new Hono<{ Variables: Variables }>()
    .basePath("/api")
    .on(["POST", "GET"], "/auth/*", (c) => {
      const { auth } = c.get("ctx");
      return auth.handler(c.req.raw);
    })
    .get("/", (c) => c.text("OK"))
    .route("/", protectedApp)
    .route("/", publicRoutes);

  const app = new Hono<{ Variables: Variables }>()
    .use(logger())
    .use("*", async (c, next) => {
      c.set("ctx", ctx);
      c.set("service", service);
      await next();
    })
    .use("*", async (c, next) => {
      if (c.req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: getCorsHeaders(env.FRONTEND_URL) });
      }
      await next();
    })
    .use(
      "*",
      cors({
        origin: env.FRONTEND_URL,
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      }),
    )
    .route("/", api)
    .onError((err, c) => {
      const res = globalErrorHandler(err, c);
      res.headers.set("Access-Control-Allow-Origin", env.FRONTEND_URL);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      return res;
    })
    .notFound((c) => {
      const res = notFoundHandler(c);
      res.headers.set("Access-Control-Allow-Origin", env.FRONTEND_URL);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      return res;
    });

  return app;
}

export type App = Awaited<ReturnType<typeof createApp>>;
