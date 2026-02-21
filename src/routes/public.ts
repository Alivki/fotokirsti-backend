import { route } from "../lib/route";
import { healthRoutes } from "./health";
import {photosRoutes} from "./photos";
import {pricelistRoutes} from "./pricelist";
import {emailRoutes} from "./email";

/**
 * Public route registry. One line per resource.
 */
const app = route();

app.route("/health", healthRoutes);
app.route("/photos", photosRoutes);
app.route("/pricelist", pricelistRoutes);
app.route("/email", emailRoutes)

export default app;
