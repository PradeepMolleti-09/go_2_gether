import http from "http";
import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { initSocket } from "./sockets";
import { logger } from "./utils/logger";

const start = async () => {
  await connectDb();
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    logger.info(`Backend listening on port ${env.port}`);
  });
};

start().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});

