import { route } from "../../lib/route";
import { z } from "zod";
import { PhotoService } from "../../services/PhotoService";
import {zValidator} from "@hono/zod-validator";

const bodySchema = z.object({
    ids: z.array(
        z.string().min(1),
    ),
});

export const deleteManyRoute = route().delete(
    "/",
    zValidator('json', bodySchema),
    async (c) => {
    const { db } = c.get("ctx");
    const body = c.req.valid('json');

    const service = new PhotoService(db);
    const deleted = await service.deleteMany(body.ids);

    return c.json(deleted);
});