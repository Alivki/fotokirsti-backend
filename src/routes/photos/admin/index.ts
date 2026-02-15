import { route } from "../../../lib/route";
import { z } from "zod";
import { PhotoService } from "../../../services/PhotoService";
import {zValidator} from "@hono/zod-validator";

const CATEGORY_MAP: Record<string, string> = {
    barn: "Barn", familie: "Familie", portrett: "Portrett",
    konfirmant: "Konfirmant", bryllup: "Bryllup",
    produkt: "Produkt", reklame: "Reklame",
};

const querySchema = z.object({
    category: z.string().optional().transform((v) => {
        if (!v?.trim()) return undefined;
        return CATEGORY_MAP[v.toLowerCase().trim()] ?? v;
    }),

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
