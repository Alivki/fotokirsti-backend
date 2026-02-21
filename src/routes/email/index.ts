import { route } from "../../lib/route";
import {emailPostRoute} from "./post";

/**
 * Authors resource router.
 * Stitches operation routes; mount under /authors in protected registry.
 */
export const emailRoutes = route()
    .route("/", emailPostRoute)
