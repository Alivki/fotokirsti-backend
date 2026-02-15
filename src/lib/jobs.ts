import type { AppContext } from "./ctx";

/**
 * Start background jobs and workers.
 * Called once when the application starts (in createApp).
 * Add cron jobs and queue workers here as needed.
 */
export function startBackgroundJobs(_ctx: AppContext): void {
  // Example: startEmailWorker(ctx);
  // Example: cron.schedule("0 * * * *", () => ...);
}
