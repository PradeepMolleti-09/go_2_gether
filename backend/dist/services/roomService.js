"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoom = exports.createRoom = void 0;
const Room_1 = require("../models/Room");
const mongoose_1 = require("mongoose");
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateRoomCode = async () => {
    let code;
    // simple retry loop to avoid collisions
    // in practice collisions are unlikely
    for (;;) {
        code = Array.from({ length: ROOM_CODE_LENGTH })
            .map(() => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)])
            .join("");
        const existing = await Room_1.Room.findOne({ code }).lean();
        if (!existing)
            break;
    }
    return code;
};
const createRoom = async (leaderId) => {
    const code = await generateRoomCode();
    const room = await Room_1.Room.create({
        code,
        leader: new mongoose_1.Types.ObjectId(leaderId),
        members: [new mongoose_1.Types.ObjectId(leaderId)],
    });
    return room;
};
exports.createRoom = createRoom;
const joinRoom = async (userId, code) => {
    const room = await Room_1.Room.findOne({ code });
    if (!room) {
        const err = new Error("Room not found");
        err.status = 404;
        throw err;
    }
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    if (!room.members.some((m) => m.equals(userObjectId))) {
        room.members.push(userObjectId);
        await room.save();
    }
    return room;
};
exports.joinRoom = joinRoom;
//# sourceMappingURL=roomService.js.map