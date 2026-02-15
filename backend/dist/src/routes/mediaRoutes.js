"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const mediaService_1 = require("../services/mediaService");
const upload = (0, multer_1.default)();
const router = (0, express_1.Router)();
router.post("/upload", auth_1.authMiddleware, upload.single("file"), async (req, res, next) => {
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
        const media = await (0, mediaService_1.uploadTripPhoto)({
            tripId,
            uploadedByUserId: req.user.id,
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
            caption,
        });
        res.status(201).json({ media });
    }
    catch (err) {
        next(err);
    }
});
router.get("/:tripId", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { tripId } = req.params;
        const media = await (0, mediaService_1.listTripMedia)(tripId);
        res.json({ media });
    }
    catch (err) {
        next(err);
    }
});
router.delete("/:mediaId", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { mediaId } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await (0, mediaService_1.deleteTripMedia)(mediaId, req.user.id);
        res.json({ message: "Media deleted successfully" });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=mediaRoutes.js.map