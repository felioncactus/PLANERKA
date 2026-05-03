import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { closeDb } from "./config/db.js";
import { runMigrations } from "./scripts/migrate.js";
import { bootstrapChatTimers } from "./services/chatTimers.service.js";

const PORT = process.env.PORT || 5000;

let server;

async function start() {
  await runMigrations();

  const app = createApp();
  server = app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });

  void bootstrapChatTimers();
}

start().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  if (!server) {
    await closeDb();
    process.exit(0);
  }
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
});
