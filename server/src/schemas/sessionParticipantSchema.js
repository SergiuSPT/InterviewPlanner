import { z } from "zod";

export const assignParticipantSchema = z.object({
  participantId: z.string().uuid("Invalid participant ID"),

  participantRole: z.enum([
    "candidate",
    "interviewer",
  ]),
});