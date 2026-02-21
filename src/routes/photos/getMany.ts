import { route } from "../../lib/route";
import { z } from "zod";
import { PhotoService } from "../../services/PhotoService";
import { zValidator } from "@hono/zod-validator";
import { PaginationSchema, getTotalPages } from "../../lib/pagination";

const categoryEnum = z.enum([
  "Barn",
  "Familie",
  "Portrett",
  "Konfirmant",
  "Bryllup",
  "Produkt",
  "Reklame",
]);

const normalizeCategory = z.preprocess((val) => {
  if (typeof val !== "string") return val;
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
}, categoryEnum);

const querySchema = PaginationSchema.extend({
  category: normalizeCategory.optional(),
  hasPrize: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
}).refine(
  (data) => !(data.hasPrize && data.category !== undefined),
  {
    message: "Cannot select a category when hasPrize is true",
    path: ["category"],
  }
);

export const getManyRoute = route().get(
  "/",
  zValidator("query", querySchema),
  async (c) => {
    const { db } = c.get("ctx");
    const { category, hasPrize, pageSize, page } = c.req.valid("query");

    const service = new PhotoService(db);
    const { photos, total } = await service.findMany(
      category,
      hasPrize,
      pageSize,
      page
    );

    const totalPages = getTotalPages(total, pageSize);

    return c.json({
      totalCount: total,
      pages: totalPages,
      nextPage: page + 1 >= totalPages ? null : page + 1,
      data: photos,
    });
  }
);
