# Deploying to Railway

## Build & start (Railpack)

This project uses **Railpack** (not Nixpacks). The start command is set in `railpack.json`:

- **Start command:** `bun run start` (in `railpack.json` → `deploy.startCommand`)

Railway sets `PORT` for you; the app reads it from the environment. Railpack will run `bun install` and then the start command.

## Environment variables (add in Railway dashboard)

Set these in your Railway project → Variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` (or let start command set it). |
| `PORT` | No | Set by Railway for web services. |
| `DATABASE_URL` | Yes | Postgres connection string (use Railway Postgres plugin and copy from service). |
| `BETTER_AUTH_SECRET` | Yes | At least 32 characters; use a long random string. |
| `BETTER_AUTH_URL` | Yes | Your backend base URL, e.g. `https://your-app.railway.app` (or `your-app.railway.app` — `https://` is added automatically). |
| `FRONTEND_URL` | Yes | Frontend **origin** only for CORS (no path): e.g. `https://your-frontend.vercel.app` — do **not** add `/api`. |
| `AWS_ACCESS_KEY_ID` | Yes | AWS access key for S3. |
| `AWS_BUCKET_NAME` | Yes | S3 bucket name. |
| `AWS_REGION` | Yes | AWS region, e.g. `eu-north-1`. |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret key for S3. |
| `RESEND_API_KEY` | No | Resend API key if you use email. |

After deployment, set `BETTER_AUTH_URL` to your actual backend URL (e.g. `https://example.railway.app`) and ensure your frontend uses this URL for API and auth.

**CORS:** `FRONTEND_URL` must be set on the **backend** service (not the frontend). Use the frontend origin only (no trailing path like `/api`), e.g. `https://fotokirsti-frontend-production.up.railway.app`. If you get "blocked by CORS policy", check that the backend has this variable set and redeploy.

**502 "Application failed to respond":** The server now starts without validating env at load, so OPTIONS (preflight) should always get a 204 with CORS. If you still get 502, check **Railway → your backend service → Logs** for startup errors (e.g. `ZodError` for invalid `BETTER_AUTH_URL`/`FRONTEND_URL`, or DB connection failures). Fix the reported env or DB issue and redeploy.

**ECONNRESET:** If you see `Error: read ECONNRESET` in logs, it usually means a TCP connection was closed by the other side (client disconnected, or DB/proxy closed an idle connection). The DB client is configured with `idle_timeout`, `connect_timeout`, and `max_lifetime` to reduce stale connections. If it still happens often, check Railway Postgres limits and that the frontend isn’t aborting requests (e.g. navigation before the request completes).

## Creating tables in the production database

You need to run migrations (or `db:push`) against the **production** `DATABASE_URL` so tables exist before the app runs.

### Option 1: One-off command in Railway (recommended)

1. In Railway, open your **backend** service.
2. Go to **Settings** → find **Deploy** or **Custom start command** (or use the **Shell** / **Run command** feature if your plan has it).
3. Or use **Deployments** → **…** on a deployment → **Run one-off command** (if available).

   If your Railway plan supports **one-off runs** or **Shell**:
   - Run: `bun run db:push`  
   - Ensure the run uses the same environment (so `DATABASE_URL` is set). Railway usually injects variables into one-off runs for that service.

### Option 2: Railway CLI (from your machine)

1. Install [Railway CLI](https://docs.railway.app/develop/cli).
2. Link the project: `railway link` (select the project and backend service).
3. Run the push using the production env:
   ```bash
   railway run bun run db:push
   ```
   `railway run` runs the command with the same env vars as your deployed service (including `DATABASE_URL` from the Postgres plugin).

### Option 3: Run locally with production DATABASE_URL

1. In Railway dashboard, copy the **Postgres** service’s `DATABASE_URL` (from Variables or Connect).
2. Locally, run:
   ```bash
   DATABASE_URL="postgres://..." bun run db:push
   ```
   Use the copied URL in place of `postgres://...`. Only do this from a trusted machine and don’t commit the URL.

After tables exist, redeploy or start the app; it should no longer crash on DB access.

## Production readiness & cost

The app is tuned for production and lower cost on Railway:

| What | Why |
|------|-----|
| **No request logging in production** | `logger()` only runs when `NODE_ENV !== "production"` to reduce log volume and cost. |
| **DB pool max 5** | Fewer connections so you stay within Railway Postgres limits and use less memory. |
| **Security headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` on all responses (no extra cost). |
| **Generic 404 in production** | Response body is "Not found" only (no method/path) to avoid leaking internals. |
| **500 errors in production** | No stack trace or internal message in JSON; only `err.message` is logged. |
| **CORS** | Single allowed origin (`FRONTEND_URL`); includes PATCH for batch-publish. |

**Cost tips:** Use the smallest Postgres plan that fits your data. Rely on `/` or `/api/health` for health checks (they don’t hit the DB). If you add more background work, consider a single worker to avoid duplicate jobs.

**Auth when DB is sleeping:** Session validation (getSession) is stateless: the session is served from a signed cookie only (cookieCache, 48h). No DB lookup for getSession, so already logged-in users stay logged in when Postgres is sleeping. **Login** still needs the DB to verify the password.
