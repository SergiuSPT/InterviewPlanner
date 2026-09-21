import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(
    32,
    "JWT_SECRET must contain at least 32 characters",
  ),

  JWT_EXPIRES_IN: z.string().default("1h"),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnvironment.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = parsedEnvironment.data;