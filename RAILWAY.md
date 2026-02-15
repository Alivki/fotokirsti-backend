# Deploying to Railway

## Build & start

- **Build command:** (leave empty or `bun install`)
- **Start command:** `bun run start` (or `bun src/index.ts`)
- **Root directory:** project root

Railway sets `PORT` for you; the app reads it from the environment.

## Environment variables (add in Railway dashboard)

Set these in your Railway project → Variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` (or let start command set it). |
| `PORT` | No | Set by Railway for web services. |
| `DATABASE_URL` | Yes | Postgres connection string (use Railway Postgres plugin and copy from service). |
| `BETTER_AUTH_SECRET` | Yes | At least 32 characters; use a long random string. |
| `BETTER_AUTH_URL` | Yes | Your backend base URL, e.g. `https://your-app.railway.app` (or `your-app.railway.app` — `https://` is added automatically). |
| `FRONTEND_URL` | Yes | Frontend origin for CORS, e.g. `https://your-frontend.vercel.app` (same optional `https://` behavior). |
| `AWS_ACCESS_KEY_ID` | Yes | AWS access key for S3. |
| `AWS_BUCKET_NAME` | Yes | S3 bucket name. |
| `AWS_REGION` | Yes | AWS region, e.g. `eu-north-1`. |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret key for S3. |
| `RESEND_API_KEY` | No | Resend API key if you use email. |

After deployment, set `BETTER_AUTH_URL` to your actual backend URL (e.g. `https://example.railway.app`) and ensure your frontend uses this URL for API and auth.

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
