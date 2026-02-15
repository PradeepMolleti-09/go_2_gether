"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reportService_1 = require("../services/reportService");
const router = (0, express_1.Router)();
router.get("/:tripId/pdf", auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { tripId } = req.params;
        const buffer = await (0, reportService_1.buildTripReportPdf)(tripId);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=\"trip-${tripId}.pdf\"`);
        res.send(buffer);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map