import { z } from "zod";

export const reportQuerySchema = z.object({
  participantId: z
    .string()
    .uuid("Invalid participant ID")
    .optional(),
});