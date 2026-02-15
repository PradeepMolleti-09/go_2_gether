import { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";

interface PresenceState {
  lastSeen: number;
  lastMovement: number;
}

const OFFLINE_THRESHOLD_MS = 60_000;
const IDLE_THRESHOLD_MS = 120_000;

const presenceByUser: Record<string, PresenceState> = {};

export const registerSafetyHandlers = (io: Server, socket: Socket) => {
  const userId = (socket.data as any).userId as string;

  const touchPresence = (moving: boolean) => {
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
    const { roomId, reason } = payload as {
      roomId: string;
      reason?: string;
    };
    if (!roomId) return;
    logger.info(`Manual SOS from user=${userId} room=${roomId}`, reason);
    io.to(roomId).emit("trip:sos", {
      userId,
      reason,
      at: Date.now(),
    });
  });

  const interval = setInterval(() => {
    const state = presenceByUser[userId];
    if (!state) return;
    const now = Date.now();
    const offlineMs = now - state.lastSeen;
    const idleMs = now - state.lastMovement;

    if (offlineMs > OFFLINE_THRESHOLD_MS) {
      logger.info(`Auto SOS offline user=${userId}`);
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
      logger.info(`Idle detection user=${userId}`);
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
  }, 15_000);

  socket.on("disconnect", () => {
    clearInterval(interval);
  });
};

