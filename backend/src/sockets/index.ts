import { Server } from "socket.io";
import http from "http";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import jwt from "jsonwebtoken";
import { registerSafetyHandlers } from "./safety";

interface SocketUserPayload {
  id: string;
}

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = jwt.verify(
        token,
        env.jwtSecret
      ) as SocketUserPayload;
      (socket.data as any).userId = payload.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket.data as any).userId as string;
    logger.info(`Socket connected ${socket.id} user=${userId}`);

    socket.on("join-room", async (roomId: string) => {
      socket.join(roomId);
      // Store the current room in socket data for disconnect handler
      (socket.data as any).currentRoom = roomId;
      try {
        // Fetch user details to broadcast to others
        const { User } = await import("../models/User");
        const user = await User.findById(userId).select("-googleId -email -createdAt -updatedAt -__v");

        if (user) {
          socket.to(roomId).emit("user-joined", {
            user: {
              id: user._id.toString(),
              name: user.name,
              avatarUrl: user.avatarUrl
            }
          });
        } else {
          socket.to(roomId).emit("user-joined", { userId });
        }
      } catch (error) {
        logger.error(`Error fetching user details for join-room: ${error}`);
        // Fallback
        socket.to(roomId).emit("user-joined", { userId });
      }
    });

    registerSafetyHandlers(io, socket);

    socket.on("location:update", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("location:update", {
          userId,
          ...payload,
        });
      }
    });

    socket.on("chat:message", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("chat:message", {
          userId,
          ...payload,
        });
      }
    });

    socket.on("chat:delete", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("chat:deleted", payload);
        socket.emit("chat:deleted", payload);
      }
    });

    socket.on("chat:edit", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("chat:edited", payload);
        socket.emit("chat:edited", payload);
      }
    });

    socket.on("trip:destination", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("trip:destination", {
          userId,
          ...payload,
        });
      }
    });

    socket.on("checkpoint:created", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("checkpoint:created", {
          userId,
          ...payload,
        });
      }
    });

    socket.on("checkpoint:deleted", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("checkpoint:deleted", {
          userId,
          ...payload,
        });
      }
    });

    socket.on("trip:started", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("trip:started", {
          userId,
          ...payload,
        });
      }
    });

    socket.on("trip:ended", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("trip:ended", {
          userId,
          ...payload,
        });
      }
    });

    socket.on("trip:route", (payload) => {
      const { roomId } = payload;
      if (roomId) {
        socket.to(roomId).emit("trip:route", {
          userId,
          ...payload,
        });
      }
    });

    socket.on("checkpoint:reached", async (payload: { roomId: string, checkpointId: string }) => {
      const { roomId, checkpointId } = payload;
      if (roomId && checkpointId) {
        try {
          const { deleteCheckpoint } = await import("../services/tripService");
          await deleteCheckpoint(checkpointId);

          socket.to(roomId).emit("checkpoint:deleted", {
            checkpointId,
            roomId
          });
          // Also emit back to sender so their UI updates if they rely on the socket event
          socket.emit("checkpoint:deleted", {
            checkpointId,
            roomId
          });
        } catch (error) {
          logger.error(`Error handling checkpoint:reached: ${error}`);
        }
      }
    });

    // Leader can kick a member
    socket.on("room:kick", (payload: { roomId: string; targetUserId: string }) => {
      const { roomId, targetUserId } = payload;
      if (roomId && targetUserId) {
        // Broadcast to the whole room that a member was removed
        io.to(roomId).emit("room:member-removed", { userId: targetUserId, roomId });
        logger.info(`User ${userId} kicked ${targetUserId} from room ${roomId}`);
      }
    });

    socket.on("disconnect", () => {
      const currentRoom = (socket.data as any).currentRoom as string | undefined;
      logger.info(`Socket disconnected ${socket.id} user=${userId}`);

      // Notify room members that user left
      if (currentRoom) {
        socket.to(currentRoom).emit("user-left", { userId });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

