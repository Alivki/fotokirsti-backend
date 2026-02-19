import { validator } from "hono/validator";
import { createMiddleware } from "hono/factory";
import z from "zod";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;
const DEFAULT_PAGE = 1;

type Variables = {
  limit: number;
  page: number;
};

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  page: z.coerce.number().min(1).optional(),
});

export const withPagination = (override?: Partial<Variables>) =>
  [
    validator("query", (value) => querySchema.parse(value)),
    createMiddleware<{ Variables: Variables }>(async (c, next) => {
      const limit = Math.min(
        Math.max(
          Number.parseInt(c.req.query("limit") || DEFAULT_LIMIT.toString(), 10),
          MIN_LIMIT,
        ),
        MAX_LIMIT,
      );

      const page = Math.max(
        Number.parseInt(c.req.query("page") || DEFAULT_PAGE.toString(), 10),
        DEFAULT_PAGE,
      );

      c.set("limit", override?.limit ?? limit);
      c.set("page", override?.page ?? page);

      await next();
    }),
  ] as const;
