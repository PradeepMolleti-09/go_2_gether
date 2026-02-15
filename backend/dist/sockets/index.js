"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const safety_1 = require("./safety");
const initSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: env_1.env.clientOrigin,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error("Unauthorized"));
        try {
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
            socket.data.userId = payload.id;
            next();
        }
        catch {
            next(new Error("Unauthorized"));
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        logger_1.logger.info(`Socket connected ${socket.id} user=${userId}`);
        socket.on("join-room", async (roomId) => {
            socket.join(roomId);
            // Store the current room in socket data for disconnect handler
            socket.data.currentRoom = roomId;
            try {
                // Fetch user details to broadcast to others
                const { User } = await Promise.resolve().then(() => __importStar(require("../models/User")));
                const user = await User.findById(userId).select("-googleId -email -createdAt -updatedAt -__v");
                if (user) {
                    socket.to(roomId).emit("user-joined", {
                        user: {
                            id: user._id.toString(),
                            name: user.name,
                            avatarUrl: user.avatarUrl
                        }
                    });
                }
                else {
                    socket.to(roomId).emit("user-joined", { userId });
                }
            }
            catch (error) {
                logger_1.logger.error(`Error fetching user details for join-room: ${error}`);
                // Fallback
                socket.to(roomId).emit("user-joined", { userId });
            }
        });
        (0, safety_1.registerSafetyHandlers)(io, socket);
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
        socket.on("trip:destination", (payload) => {
            const { roomId } = payload;
            if (roomId) {
                socket.to(roomId).emit("trip:destination", {
                    userId,
                    ...payload,
                });
            }
        });
        socket.on("disconnect", () => {
            const currentRoom = socket.data.currentRoom;
            logger_1.logger.info(`Socket disconnected ${socket.id} user=${userId}`);
            // Notify room members that user left
            if (currentRoom) {
                socket.to(currentRoom).emit("user-left", { userId });
            }
        });
    });
    return io;
};
exports.initSocket = initSocket;
//# sourceMappingURL=index.js.map