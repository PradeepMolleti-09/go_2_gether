"use strict";
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
exports.default = router;
//# sourceMappingURL=roomRoutes.js.map