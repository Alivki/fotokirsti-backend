import { route } from "../lib/route";
import { healthRoutes } from "./health";
import {photosRoutes} from "./photos";
import {pricelistRoutes} from "./pricelist";

/**
 * Public route registry. One line per resource.
 */
const app = route();

app.route("/health", healthRoutes);
app.route("/photos", photosRoutes);
app.route("/pricelist", pricelistRoutes);

export default app;
