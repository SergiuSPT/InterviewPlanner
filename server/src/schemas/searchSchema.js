import { z } from "zod";

export const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Search must contain at least 2 characters")
    .max(100),

  type: z
    .enum([
      "all",
      "sessions",
      "participants",
      "feedback",
    ])
    .default("all"),
});