import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { buildTripReportPdf } from "../services/reportService";

const router = Router();

router.get("/:tripId/pdf", authMiddleware, async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const buffer = await buildTripReportPdf(tripId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"trip-${tripId}.pdf\"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;

