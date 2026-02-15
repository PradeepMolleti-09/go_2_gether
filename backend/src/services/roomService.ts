import { Room } from "../models/Room";
import { Types } from "mongoose";

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateRoomCode = async (): Promise<string> => {
  let code: string;
  // simple retry loop to avoid collisions
  // in practice collisions are unlikely
  for (;;) {
    code = Array.from({ length: ROOM_CODE_LENGTH })
      .map(
        () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
      )
      .join("");
    const existing = await Room.findOne({ code }).lean();
    if (!existing) break;
  }
  return code;
};

export const createRoom = async (leaderId: string) => {
  const code = await generateRoomCode();
  const room = await Room.create({
    code,
    leader: new Types.ObjectId(leaderId),
    members: [new Types.ObjectId(leaderId)],
  });
  return room;
};

export const joinRoom = async (userId: string, code: string) => {
  const room = await Room.findOne({ code });
  if (!room) {
    const err = new Error("Room not found") as any;
    err.status = 404;
    throw err;
  }
  const userObjectId = new Types.ObjectId(userId);
  if (!room.members.some((m) => m.equals(userObjectId))) {
    room.members.push(userObjectId);
    await room.save();
  }
  return room;
};

