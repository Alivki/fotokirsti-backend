/**
 * Entrypoint: must not import env or anything that imports env, so the server
 * can start and respond to OPTIONS (preflight) even when env validation would fail.
 * createApp() is loaded lazily via dynamic import() on first non-OPTIONS request.
 */

import type { App } from "./app";

function corsHeadersFor(origin: string | null): Record<string, string> {
  const o = (origin ?? "").trim();
  const allowOrigin = o.startsWith("http") ? o : o ? `https://${o}` : "";
  const corsOrigin = allowOrigin || "https://fotokirsti-frontend-production.up.railway.app";
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

const port = Number(process.env.PORT) || 4000;

let appPromise: Promise<App> | null = null;
function getApp(): Promise<App> {
  if (!appPromise) {
    appPromise = import("./app").then((m) => m.createApp());
  }
  return appPromise;
}

if (process.env.NODE_ENV !== "test") {
  getApp().then(
    () => console.log(`🔥 Fotokirsti Backend: http://localhost:${port}/api`),
    (err) => console.error("App failed to start:", err),
  );
}

export default {
  port,
  fetch: (req: Request, ...args: unknown[]) => {
    if (req.method === "OPTIONS") {
      return Promise.resolve(
        new Response(null, {
          status: 204,
          headers: corsHeadersFor(req.headers.get("Origin")),
        }),
      );
    }
    return getApp()
      .then((app) => app.fetch(req, ...args))
      .catch((err) => {
        console.error("Request failed (app not ready or error):", err);
        return new Response(
          JSON.stringify({
            error: "Service unavailable",
            message: "Application failed to start or encountered an error.",
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
              ...corsHeadersFor(req.headers.get("Origin")),
            },
          },
        );
      });
  },
};
