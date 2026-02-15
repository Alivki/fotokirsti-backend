import { route } from "../../lib/route";
import { z } from "zod";
import { PhotoService } from "../../services/PhotoService";
import {zValidator} from "@hono/zod-validator";

const categoryEnum = z.enum([
    "Barn",
    "Familie",
    "Portrett",
    "Konfirmant",
    "Bryllup",
    "Produkt",
    "Reklame",
]);

const querySchema = z.object({
    category: categoryEnum.optional(),
})

export const getManyRoute = route().get(
    "/",
    zValidator('query', querySchema),
    async (c) => {
    const { db } = c.get("ctx");
    const { category } = c.req.valid('query');

    const service = new PhotoService(db);
    const photos = await service.findMany(category);

    return c.json(photos);
});
