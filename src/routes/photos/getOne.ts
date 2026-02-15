import { route } from "../../lib/route";
import { z } from "zod";
import { PhotoService } from "../../services/PhotoService";
import {zValidator} from "@hono/zod-validator";

const paramSchema = z.object({
    id: z.string().min(1),
})

export const getOneRoute = route().get(
    "/:id",
    zValidator('param', paramSchema),
    async (c) => {
    const { db } = c.get("ctx");
    const { id } = c.req.valid('param');

    const service = new PhotoService(db);
    const photo = await service.findOne(id);

    return c.json(photo);
});

