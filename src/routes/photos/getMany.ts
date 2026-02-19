import { route } from "../../lib/route";
import { z } from "zod";
import { PhotoService } from "../../services/PhotoService";
import {zValidator} from "@hono/zod-validator";
import {withPagination} from "../../middleware/pagination";

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
    hasPrize: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
    limit: z.coerce.number().min(1).max(100).optional(),
    page: z.coerce.number().min(1).optional(),
}).refine(
    (data) => !(data.hasPrize && data.category !== undefined),
    {
        message: "Cannot select a category when hasPrize is true",
        path: ["category"],
    }
);

export const getManyRoute = route().get(
    "/",
    zValidator('query', querySchema),
    ...withPagination(),
    async (c) => {
    const { db } = c.get("ctx");
    const { category, hasPrize } = c.req.valid('query');

    const { limit, page } = c.var as unknown as { limit: number; page: number };

    const service = new PhotoService(db);
    const { photos, total } = await service.findMany(category, hasPrize, limit, page);

    return c.json({
      data: photos,
      metadata: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
});
