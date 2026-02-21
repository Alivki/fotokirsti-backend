import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MiddlewareHandler } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { Resend } from "resend";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { route } from "../../lib/route";
import { env } from "../../lib/env";
import { HTTPAppException } from "../../lib/errors";
import { EmailTemplate } from "../../lib/emails/email-template";

const resend = new Resend(env.RESEND_API_KEY ?? "dummy");

function parseBearer(
  authHeader: string | undefined
): { success: true; token: string } | { success: false; error: string } {
  if (!authHeader?.startsWith("Bearer ")) {
    return { success: false, error: "Missing or invalid Authorization header" };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return { success: false, error: "Missing bearer token" };
  }
  return { success: true, token };
}

const requireContactAuth: MiddlewareHandler = async (c, next) => {
  const rawKey = env.CONTACT_API_KEY;
  const apiKey = rawKey?.trim();

  if (!apiKey) {
    throw new HTTPAppException({
      status: 503,
      message: "Email API is not configured on this server",
    });
  }

  const result = parseBearer(c.req.header("Authorization"));
  if (!result.success) {
    throw HTTPAppException.Unauthorized(result.error);
  }

  if (result.token.trim() !== apiKey) {
    throw HTTPAppException.Forbidden("Invalid API key");
  }

  await next();
};

const bodySchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  category: z.string().min(1, "Category is required"),
  message: z.string().min(1, "Message is required"),
});

const emailRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown",
  message: { status: 429, message: "Too many requests, please try again later." },
});

export const emailPostRoute = route().post(
  "/",
  emailRateLimiter,
  requireContactAuth,
  zValidator("json", bodySchema),
  async (c) => {
    const body = c.req.valid("json");

    const recipient = env.RESEND_EMAIL;
    if (!recipient) {
      throw new HTTPAppException({
        status: 503,
        message: "RESEND_EMAIL is not configured",
      });
    }
    const bodyContent = renderToStaticMarkup(
      React.createElement(EmailTemplate, body as React.ComponentProps<typeof EmailTemplate>)
    );
    const html = `<!DOCTYPE html>${bodyContent}`;
    const { data, error } = await resend.emails.send({
      from: "Fotokirsti <onboarding@resend.dev>",
      to: [recipient],
      subject: `Ny henvendelse fra ${body.firstName}`,
      html,
    });

    if (error) {
      throw HTTPAppException.BadRequest(
        error.message ?? "Failed to send email"
      );
    }

    return c.json(data);
  }
);
