import { z } from "zod";

export const createSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title cannot exceed 150 characters"),

  interviewType: z.enum([
    "technical",
    "behavioral",
    "system_design",
  ]),

  difficulty: z.enum([
    "junior",
    "mid",
    "senior",
  ]),

  scheduledAt: z.coerce.date().nullable().optional(),

  durationMinutes: z.coerce
    .number()
    .int()
    .positive()
    .max(480)
    .nullable()
    .optional(),

  notes: z
    .string()
    .trim()
    .max(5000)
    .nullable()
    .optional(),
});

export const updateSessionSchema = createSessionSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );

export const sessionIdSchema = z.string().uuid("Invalid session ID");