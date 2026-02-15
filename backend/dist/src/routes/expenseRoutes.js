"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const expenseService_1 = require("../services/expenseService");
const router = (0, express_1.Router)();
router.post("/:tripId/items", auth_1.authMiddleware, async (req, res, next) => {
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
        const expense = await (0, expenseService_1.addExpenseItem)({
            tripId: tripId,
            description,
            amount,
            paidByUserId: req.user.id,
            splitBetweenUserIds: splitBetweenUserIds ?? [req.user.id],
        });
        res.status(201).json({ expense });
    }
    catch (err) {
        next(err);
    }
});
router.get("/:tripId", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { tripId } = req.params;
        const expense = await (0, expenseService_1.getExpense)(tripId);
        res.json({ expense });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=expenseRoutes.js.map