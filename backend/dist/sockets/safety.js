"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSafetyHandlers = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("../utils/logger");
const OFFLINE_THRESHOLD_MS = 60000;
const IDLE_THRESHOLD_MS = 120000;
const presenceByUser = {};
const registerSafetyHandlers = (io, socket) => {
    const userId = socket.data.userId;
    const touchPresence = (moving) => {
        const now = Date.now();
        const existing = presenceByUser[userId] || {
            lastSeen: now,
            lastMovement: now,
        };
        presenceByUser[userId] = {
            lastSeen: now,
            lastMovement: moving ? now : existing.lastMovement,
        };
    };
    touchPresence(false);
    socket.on("location:update", () => {
        touchPresence(true);
    });
    socket.on("trip:sos", (payload) => {
        const { roomId, reason } = payload;
        if (!roomId)
            return;
        logger_1.logger.info(`Manual SOS from user=${userId} room=${roomId}`, reason);
        io.to(roomId).emit("trip:sos", {
            userId,
            reason,
            at: Date.now(),
        });
    });
    const interval = setInterval(() => {
        const state = presenceByUser[userId];
        if (!state)
            return;
        const now = Date.now();
        const offlineMs = now - state.lastSeen;
        const idleMs = now - state.lastMovement;
        if (offlineMs > OFFLINE_THRESHOLD_MS) {
            logger_1.logger.info(`Auto SOS offline user=${userId}`);
            socket.rooms.forEach((roomId) => {
                if (roomId !== socket.id) {
                    io.to(roomId).emit("trip:sos:auto", {
                        userId,
                        type: "offline",
                        at: now,
                    });
                }
            });
            state.lastSeen = now;
        }
        if (idleMs > IDLE_THRESHOLD_MS) {
            logger_1.logger.info(`Idle detection user=${userId}`);
            socket.rooms.forEach((roomId) => {
                if (roomId !== socket.id) {
                    io.to(roomId).emit("trip:alert", {
                        userId,
                        type: "idle",
                        at: now,
                    });
                }
            });
            state.lastMovement = now;
        }
    }, 15000);
    socket.on("disconnect", () => {
        clearInterval(interval);
    });
};
exports.registerSafetyHandlers = registerSafetyHandlers;
//# sourceMappingURL=safety.js.map