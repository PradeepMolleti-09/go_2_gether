import { Router } from "express";
import { verifyGoogleToken } from "../services/authService";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Auth service is running" });
});

router.post("/google", async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }
    const { user, token } = await verifyGoogleToken(idToken);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;

