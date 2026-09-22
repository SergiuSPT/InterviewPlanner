import { z } from "zod";

export const createParticipantSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(150),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255)
    .nullable()
    .optional(),

  currentRole: z
    .string()
    .trim()
    .max(150)
    .nullable()
    .optional(),

  experienceLevel: z
    .enum(["junior", "mid", "senior"])
    .nullable()
    .optional(),

  notes: z
    .string()
    .trim()
    .max(5000)
    .nullable()
    .optional(),
});

export const participantIdSchema = z
  .string()
  .uuid("Invalid participant ID");