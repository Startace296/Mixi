import cors from "cors";
import express from "express";
import helmet from "helmet";
import compression from "compression";

import authRouter from "./routes/auth.routes.js";
import callRouter from "./routes/call.routes.js";
import chatRouter from "./routes/chat.routes.js";
import friendRouter from "./routes/friend.routes.js";
import postRouter from "./routes/post.routes.js";
import userRouter from "./routes/user.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(compression());
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
app.use("/users", userRouter);
app.use("/friends", friendRouter);
app.use("/chat", chatRouter);
app.use("/posts", postRouter);
app.use("/calls", callRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.set('trust proxy', 1);

export default app;
