import { Router } from "express";
import multer from "multer";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { uploadTripPhoto, listTripMedia, deleteTripMedia } from "../services/mediaService";

const upload = multer();
const router = Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { tripId, caption } = req.body;
      if (!tripId) {
        return res.status(400).json({ message: "tripId is required" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "file is required" });
      }

      const media = await uploadTripPhoto({
        tripId,
        uploadedByUserId: req.user.id,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        caption,
      });

      res.status(201).json({ media });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:tripId", authMiddleware, async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const media = await listTripMedia(tripId);
    res.json({ media });
  } catch (err) {
    next(err);
  }
});

router.delete("/:mediaId", authMiddleware, async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await deleteTripMedia(mediaId, req.user.id);
    res.json({ message: "Media deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;

