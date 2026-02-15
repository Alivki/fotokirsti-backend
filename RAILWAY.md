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
| `BETTER_AUTH_URL` | Yes | Your backend base URL, e.g. `https://your-app.railway.app`. |
| `FRONTEND_URL` | Yes | Frontend origin for CORS, e.g. `https://your-frontend.vercel.app`. |
| `AWS_ACCESS_KEY_ID` | Yes | AWS access key for S3. |
| `AWS_BUCKET_NAME` | Yes | S3 bucket name. |
| `AWS_REGION` | Yes | AWS region, e.g. `eu-north-1`. |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret key for S3. |
| `RESEND_API_KEY` | No | Resend API key if you use email. |

After deployment, set `BETTER_AUTH_URL` to your actual backend URL (e.g. `https://example.railway.app`) and ensure your frontend uses this URL for API and auth.
