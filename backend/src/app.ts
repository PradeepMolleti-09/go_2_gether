import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import roomRoutes from "./routes/roomRoutes";
import tripRoutes from "./routes/tripRoutes";
import mediaRoutes from "./routes/mediaRoutes";
import reportRoutes from "./routes/reportRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import { errorHandler } from "./middleware/errorHandler";

export const createApp = () => {
  const app = express();

  // Flexible CORS - Reflects the requester's origin if it matches our pattern (Vercel or Local)
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow if no origin (like mobile apps/curl) or if it's our domain
        if (!origin || origin.includes("vercel.app") || origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("onrender.com")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "unsafe-none" },
      crossOriginEmbedderPolicy: false,
    })
  );


  app.use(morgan("dev"));
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/rooms", roomRoutes);
  app.use("/trips", tripRoutes);
  app.use("/media", mediaRoutes);
  app.use("/reports", reportRoutes);
  app.use("/expenses", expenseRoutes);

  app.use(errorHandler);

  return app;
};

