import { route } from "../../lib/route";
import {historyRoute} from "./history";
import {getRoute} from "./get";
import {postRoute} from "./post";
import {deleteOneRoute} from "./deleteOne";
import {deleteManyRoute} from "./deleteMany";

/**
 * Authors resource router.
 * Stitches operation routes; mount under /authors in protected registry.
 */
export const pricelistRoutes = route()
    .route("/", getRoute)

export const pricelistRoutesProtected = route()
    .route("/history", historyRoute)
    .route("/", postRoute)
    .route("/", deleteOneRoute)
    .route("/", deleteManyRoute)
