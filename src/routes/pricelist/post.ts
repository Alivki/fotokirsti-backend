import { route } from "../../lib/route";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {PricelistService} from "../../services/PricelistService";

const bodySchema = z.object({
    name: z.string().min(1),
    type: z.literal("application/pdf"),
    fileSize: z.number().optional(),
});

export const postRoute = route().post(
    "/",
    zValidator("json", bodySchema),
    async (c) => {
        const { db } = c.get("ctx");
        const body = c.req.valid("json");

        const service = new PricelistService(db);

        const result = await service.createAndActivate(
            body.name,
            body.type,
            body.fileSize,
        );

        return c.json(result);
    }
);
