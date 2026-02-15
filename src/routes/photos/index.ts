import { route } from "../../lib/route";
import {uploadUrlsRoute} from "./upload-urls";
import {getManyRoute} from "./getMany";
import {getOneRoute} from "./getOne";
import {createRoute} from "./create";
import {updateRoute} from "./update";
import {deleteOneRoute} from "./deleteOne";
import {deleteManyRoute} from "./deleteMany";
import {getManyAdminRoute} from "./admin";
import {batchPublishRoute} from "./batch-publish";

/**
 * Authors resource router.
 * Stitches operation routes; mount under /authors in protected registry.
 */
export const photosRoutes = route()
    .route("/", getManyRoute)
    .route("/", getOneRoute)

export const photosRoutesProtected = route()
    .route("/upload-urls", uploadUrlsRoute)
    .route("/admin", getManyAdminRoute)
    .route("/batch-publish", batchPublishRoute)
    .route("/", createRoute)
    .route("/", updateRoute)
    .route("/", deleteOneRoute)
    .route("/", deleteManyRoute)
