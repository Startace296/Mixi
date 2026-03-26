import cors from "cors";
import express from "express";

import authRouter from "./routes/auth.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "ChatApp backend is running",
  });
});

app.use("/auth", authRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
