import { route } from "../../lib/route";

/**
 * Health check resource. Mount under /health in public registry.
 */
export const healthRoutes = route().get("/", (c) => c.text("OK"));
