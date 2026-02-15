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

const medalEnum = z.enum([
    "Gull",
    "Sølv",
    "Bronse",
    "Hederlig omtale",
]);

const paramSchema = z.object({
    id: z.string().min(1),
})

export const bodySchema = z.object({
    title: z.string().optional().nullable(),
    alt: z.string().optional().nullable(),
    published: z.boolean().default(true),
    category: categoryEnum.optional().nullable(),
    hasPrize: z.boolean().default(false),
    prizeTitle: z.string().optional().nullable(),
    prizeMedal: medalEnum.optional().nullable(),
});

export const updateRoute = route().patch(
    "/:id",
    zValidator('param', paramSchema),
    zValidator('json', bodySchema),
    async (c) => {
        const { db } = c.get("ctx");
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');

        const service = new PhotoService(db);
        const updated = await service.updatePhoto(id, body);

        return c.json(updated);
    });



