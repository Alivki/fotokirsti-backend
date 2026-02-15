import { Hono } from "hono";
import type { AuthEnv } from "../lib/types";
import { photosRoutesProtected } from "./photos";
import {pricelistRoutesProtected} from "./pricelist";

/**
 * Protected route registry. One line per resource.
 * requireAuth is applied when this app is mounted in index.ts.
 */
const app = new Hono<AuthEnv>();

app.route("/photos", photosRoutesProtected);
app.route("/pricelist", pricelistRoutesProtected);

export default app;
