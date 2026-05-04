import { Server } from "socket.io";

import { verifyAccessToken } from "./utils/jwt.js";

let ioInstance = null;
const userPresence = new Map();

function getPresenceForUser(userId) {
  const presence = userPresence.get(String(userId));
  if (!presence || presence.sockets.size === 0) {
    return {
      userId: String(userId),
      status: "offline",
      lastActiveAt: presence?.lastActiveAt || null,
    };
  }

  const statuses = [...presence.sockets.values()];
  const status = statuses.includes("online") ? "online" : "away";

  return {
    userId: String(userId),
    status,
    lastActiveAt: presence.lastActiveAt || null,
  };
}

function setSocketPresence(socket, nextStatus) {
  const userId = String(socket.user.id);
  const status = nextStatus === "away" ? "away" : "online";
  const presence = userPresence.get(userId) || {
    sockets: new Map(),
    lastActiveAt: null,
  };

  presence.sockets.set(socket.id, status);
  presence.lastActiveAt = new Date();
  userPresence.set(userId, presence);

  const nextPresence = getPresenceForUser(userId);
  ioInstance.emit("presence:changed", nextPresence);
  return nextPresence;
}

function removeSocketPresence(socket) {
  const userId = String(socket.user.id);
  const presence = userPresence.get(userId);
  if (!presence) return;

  presence.sockets.delete(socket.id);
  presence.lastActiveAt = new Date();

  if (presence.sockets.size === 0) {
    userPresence.set(userId, presence);
  }

  ioInstance.emit("presence:changed", getPresenceForUser(userId));
}

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
    setSocketPresence(socket, "online");

    socket.on("presence:set", (payload = {}) => {
      setSocketPresence(socket, payload.status);
    });

    socket.on("disconnect", () => {
      removeSocketPresence(socket);
    });
  });

  return ioInstance;
}

export function getUserPresence(userId) {
  return getPresenceForUser(userId);
}

export function getUserRoom(userId) {
  return `user:${String(userId)}`;
}

export function emitToUser(userId, eventName, payload = {}) {
  if (!ioInstance || !userId) return;
  ioInstance.to(getUserRoom(userId)).emit(eventName, payload);
}
