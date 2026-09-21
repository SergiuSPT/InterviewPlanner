import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const database = new Pool({
  connectionString: env.DATABASE_URL,
});

database.on("error", (error) => {
  console.error("Unexpected PostgreSQL connection error:", error);
});