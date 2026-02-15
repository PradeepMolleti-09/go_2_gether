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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const roomService_1 = require("../services/roomService");
const Room_1 = require("../models/Room");
const router = (0, express_1.Router)();
const mapRoomToDto = async (roomId) => {
    const room = await Room_1.Room.findById(roomId)
        .populate("leader")
        .populate("members")
        .populate("activeTrip")
        .lean();
    if (!room)
        return null;
    const leaderRaw = room.leader;
    const membersRaw = (room.members || []);
    const activeTripRaw = room.activeTrip;
    const leader = leaderRaw && typeof leaderRaw === "object" && "name" in leaderRaw
        ? {
            id: String(leaderRaw._id ?? leaderRaw),
            name: String(leaderRaw.name ?? ""),
            avatarUrl: leaderRaw.avatarUrl ?? undefined,
        }
        : { id: "", name: "", avatarUrl: undefined };
    const members = membersRaw.map((m) => {
        if (m && typeof m === "object" && "name" in m) {
            return {
                id: String(m._id ?? m),
                name: String(m.name ?? ""),
                avatarUrl: m.avatarUrl ?? undefined,
            };
        }
        return { id: String(m ?? ""), name: "", avatarUrl: undefined };
    });
    const activeTrip = activeTripRaw && typeof activeTripRaw === "object" && "status" in activeTripRaw
        ? {
            id: String(activeTripRaw._id ?? activeTripRaw),
            status: activeTripRaw.status,
            destination: activeTripRaw.destination ?? null,
            startTime: activeTripRaw.startTime ?? null,
        }
        : null;
    return {
        _id: room._id.toString(),
        code: room.code,
        leader,
        members,
        activeTrip,
    };
};
router.post("/", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const room = await (0, roomService_1.createRoom)(userId);
        const dto = await mapRoomToDto(room._id.toString());
        res.status(201).json({ room: dto });
    }
    catch (err) {
        next(err);
    }
});
router.post("/join", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: "Room code is required" });
        }
        const room = await (0, roomService_1.joinRoom)(userId, code.trim().toUpperCase());
        const dto = await mapRoomToDto(room._id.toString());
        res.json({ room: dto });
    }
    catch (err) {
        next(err);
    }
});
router.post("/:roomId/transfer-leader", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;
        const { newLeaderId } = req.body;
        if (!newLeaderId) {
            return res.status(400).json({ message: "New leader ID is required" });
        }
        const room = await Room_1.Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if current user is the leader
        if (room.leader.toString() !== userId) {
            return res.status(403).json({ message: "Only the leader can transfer leadership" });
        }
        // Check if new leader is a member of the room
        const isMember = room.members.some((m) => m.toString() === newLeaderId);
        if (!isMember) {
            return res.status(400).json({ message: "New leader must be a member of the room" });
        }
        // Transfer leadership
        room.leader = newLeaderId;
        await room.save();
        const dto = await mapRoomToDto(room._id.toString());
        // Broadcast update to all room members
        const { getIO } = await Promise.resolve().then(() => __importStar(require("../sockets")));
        getIO().to(roomId).emit("leader:updated", {
            roomId,
            newLeaderId,
            room: dto
        });
        res.json({ room: dto });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=roomRoutes.js.map