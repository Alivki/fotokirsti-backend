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

export const bodySchema = z.object({
    photos: z.array(
        z.object({
            id: z.string().min(1),
            s3Key: z.string().min(1),
            title: z.string().optional().nullable(),
            alt: z.string().optional().nullable(),
            published: z.boolean().default(true),
            category: categoryEnum.optional().nullable(),
            hasPrize: z.boolean().default(false),
            prizeTitle: z.string().optional().nullable(),
            prizeMedal: medalEnum.optional().nullable(),
        })
    ),
});

export const createRoute = route().post(
    "/",
    zValidator('json', bodySchema),
    async (c) => {
    const { db } = c.get("ctx");
        const body = c.req.valid('json');

    const service = new PhotoService(db);
    const created = await service.createPhotos(body.photos);

    return c.json(created, 201);
});


