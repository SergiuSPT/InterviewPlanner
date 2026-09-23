import { Router } from "express";
import {
  getOverviewReport,
} from "../controllers/reportController.js";

export const reportRouter = Router();

reportRouter.get("/overview", getOverviewReport);