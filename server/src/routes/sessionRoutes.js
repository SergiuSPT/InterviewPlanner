import { Router } from "express";
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  completeSession,
} from "../controllers/sessionController.js";
import {
  assignParticipant,
  getSessionParticipants,
  removeParticipant,
} from "../controllers/sessionParticipantController.js";

export const sessionRouter = Router();

sessionRouter.get("/", getSessions);
sessionRouter.get("/:id", getSessionById);
sessionRouter.post("/", createSession);
sessionRouter.patch("/:id", updateSession);
sessionRouter.patch("/:id/complete", completeSession);
sessionRouter.post("/:id/participants", assignParticipant);
sessionRouter.get("/:id/participants", getSessionParticipants);
sessionRouter.delete("/:id/participants/:participantId", removeParticipant);