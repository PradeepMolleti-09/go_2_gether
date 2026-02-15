"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "Auth service is running" });
});
router.post("/google", async (req, res, next) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: "idToken is required" });
        }
        const { user, token } = await (0, authService_1.verifyGoogleToken)(idToken);
        res.json({ user, token });
    }
    catch (err) {
        next(err);
    }
});
router.get("/me", auth_1.authMiddleware, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User_1.User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map