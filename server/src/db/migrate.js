import { readFile } from "node:fs/promises";
import { database } from "../config/database.js";

async function migrate() {
  try {
    const schemaUrl = new URL(
      "../../database/schema.sql",
      import.meta.url,
    );

    const schema = await readFile(schemaUrl, "utf8");

    await database.query(schema);

    console.log("Database schema applied successfully.");
  } catch (error) {
    console.error("Database migration failed:", error);
    process.exitCode = 1;
  } finally {
    await database.end();
  }
}

await migrate();