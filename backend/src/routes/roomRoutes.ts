import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { createRoom, joinRoom } from "../services/roomService";
import { Room } from "../models/Room";

const router = Router();

const mapRoomToDto = async (roomId: string) => {
  const room = await Room.findById(roomId)
    .populate("leader")
    .populate("members")
    .populate("activeTrip")
    .lean();
  if (!room) return null;

  const leaderRaw = room.leader as any;
  const membersRaw = (room.members || []) as any[];
  const activeTripRaw = room.activeTrip as any;

  const leader =
    leaderRaw && typeof leaderRaw === "object" && "name" in leaderRaw
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

  const activeTrip =
    activeTripRaw && typeof activeTripRaw === "object" && "status" in activeTripRaw
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

router.post("/", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const room = await createRoom(userId);
    const dto = await mapRoomToDto(room._id.toString());
    res.status(201).json({ room: dto });
  } catch (err) {
    next(err);
  }
});

router.post("/join", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Room code is required" });
    }
    const room = await joinRoom(userId, code.trim().toUpperCase());
    const dto = await mapRoomToDto(room._id.toString());
    res.json({ room: dto });
  } catch (err) {
    next(err);
  }
});

router.post("/:roomId/transfer-leader", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const { newLeaderId } = req.body;

    if (!newLeaderId) {
      return res.status(400).json({ message: "New leader ID is required" });
    }

    const room = await Room.findById(roomId);
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
    room.leader = newLeaderId as any;
    await room.save();

    const dto = await mapRoomToDto(room._id.toString());

    // Broadcast update to all room members
    const { getIO } = await import("../sockets");
    getIO().to(roomId as string).emit("leader:updated", {
      roomId,
      newLeaderId,
      room: dto
    });

    res.json({ room: dto });
  } catch (err) {
    next(err);
  }
});

export default router;

