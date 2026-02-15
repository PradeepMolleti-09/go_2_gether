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
        // Allow all origins for now to definitively rule out CORS issues during debugging
        callback(null, true);
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
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
          connectSrc: ["'self'", "https://go-2-gether-backend.onrender.com", "*.onrender.com", "https://accounts.google.com"],
          frameSrc: ["'self'", "https://accounts.google.com"],
          imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
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
    res.json({ status: "ok", version: "v3-coop-fix" });
  });

  app.get("/auth-check", (_req, res) => {
    res.json({ message: "Root auth check hit" });
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

