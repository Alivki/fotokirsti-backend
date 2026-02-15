import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["production", "development", "test"])
      .default("development"),
    PORT: z
      .string()
      .default("4000")
      .transform((val) => Number(val)),

    // Database
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:4000"),

    // CORS / Frontend
    FRONTEND_URL: z.string().url().default("http://localhost:3000"),

    // AWS / S3
    AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
    AWS_BUCKET_NAME: z.string().min(1, "AWS_BUCKET_NAME is required"),
    AWS_REGION: z.string().min(1, "AWS_REGION is required"),
    AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),

    // Optional: Email (Resend)
    RESEND_API_KEY: z.string().optional(),
  })
;

type Env = z.infer<typeof envSchema>;

const testEnvVariables: Env = {
  NODE_ENV: "test",
  PORT: 4000,
  DATABASE_URL: "postgres://test:test@localhost:5432/test",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:4000",
  FRONTEND_URL: "http://localhost:3000",
  AWS_ACCESS_KEY_ID: "test",
  AWS_BUCKET_NAME: "test-bucket",
  AWS_REGION: "eu-north-1",
  AWS_SECRET_ACCESS_KEY: "test-secret",
  RESEND_API_KEY: undefined,
};

/**
 * Application environment variables.
 * Use this instead of process.env for type safety and validation.
 */
export const env: Env =
  process.env.NODE_ENV === "test"
    ? testEnvVariables
    : envSchema.parse(process.env);

/**
 * S3 client options derived from env. Pass to Bun s3.file() and s3.presign() so
 * AWS_ACCESS_KEY_ID, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRET_ACCESS_KEY are used.
 */
export const s3Options = {
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  bucket: env.AWS_BUCKET_NAME,
  region: env.AWS_REGION,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
};
