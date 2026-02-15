"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const tripService_1 = require("../services/tripService");
const router = (0, express_1.Router)();
router.post("/rooms/:roomId/start", auth_1.authMiddleware, permissions_1.requireLeaderForRoom, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { destination } = req.body;
        const trip = await (0, tripService_1.startTrip)(roomId, destination);
        res.status(201).json({ trip });
    }
    catch (err) {
        next(err);
    }
});
router.post("/rooms/:roomId/end", auth_1.authMiddleware, permissions_1.requireLeaderForRoom, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const trip = await (0, tripService_1.endTrip)(roomId);
        res.json({ trip });
    }
    catch (err) {
        next(err);
    }
});
router.post("/rooms/:roomId/destination", auth_1.authMiddleware, permissions_1.requireLeaderForRoom, async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { lat, lng, address } = req.body;
        if (typeof lat !== "number" || typeof lng !== "number") {
            return res
                .status(400)
                .json({ message: "lat and lng are required numbers" });
        }
        const trip = await (0, tripService_1.setDestination)(roomId, { lat, lng, address });
        res.json({ trip });
    }
    catch (err) {
        next(err);
    }
});
router.post("/:tripId/checkpoints", auth_1.authMiddleware, async (req, res, next) => {
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
        const checkpoint = await (0, tripService_1.createCheckpoint)({
            tripId: tripId,
            title,
            description,
            lat,
            lng,
            createdByUserId: req.user.id,
        });
        res.status(201).json({ checkpoint });
    }
    catch (err) {
        next(err);
    }
});
router.get("/:tripId/checkpoints", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { tripId } = req.params;
        const checkpoints = await (0, tripService_1.getCheckpoints)(tripId);
        res.json({ checkpoints });
    }
    catch (err) {
        next(err);
    }
});
router.delete("/checkpoints/:checkpointId", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { checkpointId } = req.params;
        await (0, tripService_1.deleteCheckpoint)(checkpointId);
        res.json({ message: "Checkpoint deleted" });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=tripRoutes.js.map