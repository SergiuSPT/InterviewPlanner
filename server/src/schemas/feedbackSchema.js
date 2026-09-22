import { z } from "zod";

export const completeSessionSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate ID"),

  reviewerId: z.string().uuid("Invalid reviewer ID"),

  overallScore: z.coerce
    .number()
    .int()
    .min(1)
    .max(5),

  strengths: z
    .string()
    .trim()
    .min(1, "Strengths are required")
    .max(5000),

  improvementAreas: z
    .string()
    .trim()
    .min(1, "Improvement areas are required")
    .max(5000),

  outcome: z.enum([
    "passed",
    "needs_improvement",
    "failed",
  ]),

  recommendation: z
    .enum([
      "strong_hire",
      "hire",
      "neutral",
      "no_hire",
      "strong_no_hire",
    ])
    .nullable()
    .optional(),

  additionalComments: z
    .string()
    .trim()
    .max(5000)
    .nullable()
    .optional(),
});