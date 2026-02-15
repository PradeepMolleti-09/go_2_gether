"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireLeaderForRoom = void 0;
const Room_1 = require("../models/Room");
const requireLeaderForRoom = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { roomId } = req.params;
        const room = await Room_1.Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        if (!room.leader.equals(req.user.id)) {
            return res.status(403).json({ message: "Leader role required" });
        }
        req.room = room;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.requireLeaderForRoom = requireLeaderForRoom;
//# sourceMappingURL=permissions.js.map