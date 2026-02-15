import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireLeaderForRoom } from "../middleware/permissions";
import {
  startTrip,
  endTrip,
  setDestination,
  createCheckpoint,
  getCheckpoints,
  deleteCheckpoint,
} from "../services/tripService";

const router = Router();

router.post(
  "/rooms/:roomId/start",
  authMiddleware,
  requireLeaderForRoom,
  async (req: AuthRequest, res, next) => {
    try {
      const { roomId } = req.params;
      const { destination } = req.body as {
        destination?: { lat: number; lng: number; address?: string };
      };
      const trip = await startTrip(roomId as string, destination);
      res.status(201).json({ trip });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/rooms/:roomId/end",
  authMiddleware,
  requireLeaderForRoom,
  async (req: AuthRequest, res, next) => {
    try {
      const { roomId } = req.params;
      const trip = await endTrip(roomId as string);
      res.json({ trip });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/rooms/:roomId/destination",
  authMiddleware,
  requireLeaderForRoom,
  async (req: AuthRequest, res, next) => {
    try {
      const { roomId } = req.params;
      const { lat, lng, address } = req.body;
      if (typeof lat !== "number" || typeof lng !== "number") {
        return res
          .status(400)
          .json({ message: "lat and lng are required numbers" });
      }
      const trip = await setDestination(roomId as string, { lat, lng, address });
      res.json({ trip });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:tripId/checkpoints",
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { tripId } = req.params;
      const { title, description, lat, lng } = req.body;
      if (!title || typeof lat !== "number" || typeof lng !== "number") {
        return res
          .status(400)
          .json({ message: "title, lat and lng are required" });
      }
      const checkpoint = await createCheckpoint({
        tripId: tripId as string,
        title,
        description,
        lat,
        lng,
        createdByUserId: req.user.id,
      });
      res.status(201).json({ checkpoint });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:tripId/checkpoints",
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const { tripId } = req.params;
      const checkpoints = await getCheckpoints(tripId as string);
      res.json({ checkpoints });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/checkpoints/:checkpointId",
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const { checkpointId } = req.params;
      await deleteCheckpoint(checkpointId as string);
      res.json({ message: "Checkpoint deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

