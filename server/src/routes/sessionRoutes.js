import { Router } from "express";
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  completeSession,
} from "../controllers/sessionController.js";

export const sessionRouter = Router();

sessionRouter.get("/", getSessions);
sessionRouter.get("/:id", getSessionById);
sessionRouter.post("/", createSession);
sessionRouter.patch("/:id", updateSession);
sessionRouter.patch("/:id/complete", completeSession);