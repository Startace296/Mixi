import { Server } from "socket.io";

import { verifyAccessToken } from "./utils/jwt.js";

let ioInstance = null;

function getAllowedOrigins() {
  const fallbackOrigins = ["http://localhost:3000", "http://localhost:5173"];
  const clientUrl = process.env.CLIENT_URL;

  if (!clientUrl) return fallbackOrigins;
  return clientUrl.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || "";
      const payload = verifyAccessToken(token);

      if (!payload?.sub) {
        return next(new Error("Unauthorized"));
      }

      socket.user = {
        id: String(payload.sub),
        email: payload.email,
        provider: payload.provider,
      };

      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.join(getUserRoom(socket.user.id));
  });

  return ioInstance;
}

export function getUserRoom(userId) {
  return `user:${String(userId)}`;
}

export function emitToUser(userId, eventName, payload = {}) {
  if (!ioInstance || !userId) return;
  ioInstance.to(getUserRoom(userId)).emit(eventName, payload);
}
