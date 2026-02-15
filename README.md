To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

Open http://localhost:4000/api (health: http://localhost:4000/api/).

### App structure

- **`createApp()`** – Builds the Hono app with injected context and services (testable by passing `{ ctx, service }`).
- **`lib/ctx`** – `AppContext` (db, auth) and `AppServices`; created in `createAppContext()` and injected per request.
- **`lib/env`** – Validated env via Zod; use `env` instead of `process.env`.
- **`lib/errors`** – `HTTPAppException` and standard error handlers (`globalErrorHandler`, `notFoundHandler`).
- **`lib/jobs`** – Placeholder for background jobs; extend `startBackgroundJobs(ctx)` when needed.
- **Routes** – Public in `routes/public.ts`, protected in `routes/protected.ts`; protected routes use `requireAuth` and get `user`/`session` from context.

### Production

- Set **`FRONTEND_URL`** to your frontend origin (e.g. `https://your-app.com`) so CORS allows credentialed requests from that origin only. Do not use `*` with credentials.
- Set **`BETTER_AUTH_URL`** to your backend base URL (e.g. `https://api.your-app.com`).
