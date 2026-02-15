import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { Room } from "../models/Room";

export const requireLeaderForRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.leader.equals(req.user.id)) {
      return res.status(403).json({ message: "Leader role required" });
    }
    (req as any).room = room;
    next();
  } catch (err) {
    next(err);
  }
};

