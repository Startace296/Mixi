import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import healthRoutes from "./routes/health.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((v) => v.trim()).filter(Boolean)
  : true;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({ ok: true, name: "chatapp-backend" });
});

app.use("/health", healthRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
