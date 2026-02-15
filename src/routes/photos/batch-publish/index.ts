import {route} from "../../../lib/route";
import {zValidator} from "@hono/zod-validator";
import {PhotoService} from "../../../services/PhotoService";
import {z} from "zod";

const bodySchema = z.object({
    ids: z.array(
        z.string().min(1),
    ),
    published: z.boolean(),
});

export const batchPublishRoute = route().patch(
    "/",
    zValidator('json', bodySchema),
    async (c) => {
        const { db } = c.get("ctx");
        const body = c.req.valid('json');

        const service = new PhotoService(db);
        const published = await service.batchPublish(body.ids, body.published);

        return c.json(published);
    });