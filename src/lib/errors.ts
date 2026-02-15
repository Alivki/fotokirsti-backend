import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { env } from "./env";

/**
 * Domain-level validation error for use in service/domain layers.
 * The global error handler converts this to a 422 HTTP response.
 */
export class ValidationError extends Error {
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

/**
 * Standardized error response schema for the API.
 */
export const httpAppExceptionSchema = z.object({
  status: z.number().describe("HTTP status code"),
  message: z.string().describe("Error message"),
  meta: z.unknown().optional().describe("Additional metadata"),
});

export type HttpAppExceptionData = z.infer<typeof httpAppExceptionSchema>;

/**
 * Custom HTTP exception with standardized JSON response format.
 */
export class HTTPAppException extends HTTPException {
  public providedMessage: string;
  public meta?: unknown;

  constructor(data: HttpAppExceptionData) {
    const { status } = data;
    super(status as ContentfulStatusCode, {
      res: new Response(JSON.stringify(httpAppExceptionSchema.parse(data)), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    });
    this.providedMessage = data.message;
    this.meta = data.meta;
  }

  static BadRequest(message = "Bad request", meta?: unknown) {
    return new HTTPAppException({ status: 400, message, meta });
  }

  static Unauthorized(message = "Authentication required") {
    return new HTTPAppException({ status: 401, message });
  }

  static Forbidden(
    message = "You don't have permission to access this resource",
  ) {
    return new HTTPAppException({ status: 403, message });
  }

  static NotFound(resource = "Resource") {
    return new HTTPAppException({
      status: 404,
      message: `${resource} not found`,
    });
  }

  static Conflict(message = "Resource already exists") {
    return new HTTPAppException({ status: 409, message });
  }

  static UnprocessableEntity(message = "Validation failed", errors?: unknown) {
    return new HTTPAppException({ status: 422, message, meta: errors });
  }

  static InternalError(message = "Internal server error") {
    return new HTTPAppException({ status: 500, message });
  }
}

/**
 * Global error handler for Hono apps.
 */
export function globalErrorHandler(err: Error, c: Context): Response {
  if (err instanceof HTTPAppException) {
    return err.getResponse();
  }

  if (err instanceof ValidationError) {
    const response: HttpAppExceptionData = {
      status: 422,
      message: err.message,
      meta: err.details,
    };
    return c.json(response, 422);
  }

  if (err instanceof z.ZodError) {
    const response: HttpAppExceptionData = {
      status: 422,
      message: "Validation failed",
      meta: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
    return c.json(response, 422);
  }

  if (err instanceof HTTPException) {
    const response: HttpAppExceptionData = {
      status: err.status,
      message: err.message || "An error occurred",
    };
    return c.json(response, err.status);
  }

  console.error("Unhandled error:", err);

  const response: HttpAppExceptionData = {
    status: 500,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
    meta: env.NODE_ENV === "production" ? undefined : { stack: err.stack },
  };
  return c.json(response, 500);
}

/**
 * Not found handler for Hono apps.
 */
export function notFoundHandler(c: Context): Response {
  const response: HttpAppExceptionData = {
    status: 404,
    message: `Route not found: ${c.req.method} ${c.req.path}`,
  };
  return c.json(response, 404);
}
