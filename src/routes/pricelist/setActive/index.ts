import { route } from "../../../lib/route";
import {zValidator} from "@hono/zod-validator";
import {z} from "zod";
import {PricelistService} from "../../../services/PricelistService";

const paramSchema = z.object({
    id: z.string().min(1),
})

export const setActiveRoute = route().patch(
    "/:id",
    zValidator('param', paramSchema),
    async (c) => {
        const { db } = c.get("ctx");
        const { id } = c.req.valid('param');

        const service = new PricelistService(db);
        const deleted = await service.setActive(id);

        return c.json(deleted);
    });