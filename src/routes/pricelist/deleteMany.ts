import { route } from "../../lib/route";
import { z } from "zod";
import {zValidator} from "@hono/zod-validator";
import {PricelistService} from "../../services/PricelistService";

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

    const service = new PricelistService(db);
    const deleted = await service.deleteMany(body.ids);

    return c.json(deleted);
});