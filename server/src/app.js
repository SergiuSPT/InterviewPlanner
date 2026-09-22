import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { database } from "./config/database.js";
import { sessionRouter } from "./routes/sessionRoutes.js";
import { participantRouter } from "./routes/participantRoutes.js";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", async (request, response) => {
  try {
    const result = await database.query(`
      SELECT
        current_database() AS database_name,
        NOW() AS server_time
    `);

    response.status(200).json({
      success: true,
      message: "Server and database are connected",
      database: result.rows[0].database_name,
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    response.status(503).json({
      success: false,
      message: "Server is running, but the database connection failed",
    });
  }
});

app.use("/api/sessions", sessionRouter);
app.use("/api/participants", participantRouter);

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, request, response, next) => {
  console.error(error);

  response.status(500).json({
    success: false,
    message: "An unexpected server error occurred",
  });
});