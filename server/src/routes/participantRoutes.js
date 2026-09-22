import { Router } from "express";
import {
  createParticipant,
  getParticipantById,
  getParticipants,
} from "../controllers/participantController.js";
import {
  getParticipantHistory,
} from "../controllers/sessionParticipantController.js";

export const participantRouter = Router();

participantRouter.get("/", getParticipants);
participantRouter.get("/:id", getParticipantById);
participantRouter.get("/:id/sessions", getParticipantHistory);
participantRouter.post("/", createParticipant);