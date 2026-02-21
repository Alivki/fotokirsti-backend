import z from "zod";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;
const DEFAULT_OFFSET = 0;

export const PaginationSchema = z.object({
  pageSize: z.coerce
    .number()
    .min(MIN_LIMIT)
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT)
    .describe("Number of items to return"),
  page: z.coerce
    .number()
    .min(0)
    .default(DEFAULT_OFFSET)
    .describe("0-based page index"),
});

export const PaginationResponseSchema = z.object({
  totalCount: z.number().describe("Total number of items available"),
  pages: z.number().describe("Total number of pages available"),
  nextPage: z
    .number()
    .nullable()
    .describe("The next page number that can be fetched"),
});

export const PagniationResponseSchema = PaginationResponseSchema;

export const getPageOffset = (page: number, pageSize: number) => page * pageSize;

export const getTotalPages = (totalCount: number, pageSize: number) =>
  pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
