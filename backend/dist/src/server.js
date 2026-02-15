"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const sockets_1 = require("./sockets");
const logger_1 = require("./utils/logger");
const start = async () => {
    await (0, db_1.connectDb)();
    const app = (0, app_1.createApp)();
    const server = http_1.default.createServer(app);
    (0, sockets_1.initSocket)(server);
    server.listen(env_1.env.port, () => {
        logger_1.logger.info(`Backend listening on port ${env_1.env.port}`);
    });
};
start().catch((err) => {
    logger_1.logger.error("Failed to start server", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map