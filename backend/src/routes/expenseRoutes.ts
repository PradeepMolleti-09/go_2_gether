import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { addExpenseItem, getExpense } from "../services/expenseService";

const router = Router();

router.post("/:tripId/items", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { tripId } = req.params;
    const { description, amount, splitBetweenUserIds } = req.body;
    if (!description || typeof amount !== "number") {
      return res
        .status(400)
        .json({ message: "description and numeric amount are required" });
    }
    const expense = await addExpenseItem({
      tripId: tripId as string,
      description,
      amount,
      paidByUserId: req.user.id,
      splitBetweenUserIds: splitBetweenUserIds ?? [req.user.id],
    });
    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
});

router.get("/:tripId", authMiddleware, async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const expense = await getExpense(tripId as string);
    res.json({ expense });
  } catch (err) {
    next(err);
  }
});

export default router;

