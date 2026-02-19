import { route } from "../../../lib/route";
import { z } from "zod";
import { PhotoService } from "../../../services/PhotoService";
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

    published: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),

    hasPrize: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
});

export const getManyAdminRoute = route().get(
    "/",
    zValidator('query', querySchema),
    async (c) => {
        const { db } = c.get("ctx");
        const { category, hasPrize, published } = c.req.valid('query');

        const service = new PhotoService(db);
        const photos = await service.findManyAdmin(
            category,
            published,
            hasPrize
        );


        return c.json(photos);
    });
