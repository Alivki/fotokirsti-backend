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

export const createApp = async (variables?: { ctx: AppContext; service: AppServices }) => {
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
    .onError(globalErrorHandler)
    .notFound(notFoundHandler);

  return app;
};

export type App = Awaited<ReturnType<typeof createApp>>;

const appPromise = createApp();

if (env.NODE_ENV !== "test") {
  appPromise.then(() => {
    console.log(`🔥 Fotokirsti Backend: http://localhost:${env.PORT}/api`);
  });
}

export default {
  port: env.PORT,
  fetch: (req: Request, ...args: unknown[]) =>
    appPromise.then((app) => app.fetch(req, ...args)),
};
