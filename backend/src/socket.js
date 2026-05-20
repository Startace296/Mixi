import { Server } from "socket.io";
import mongoose from "mongoose";

import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import { verifyAccessToken } from "./utils/jwt.js";

let ioInstance = null;
const userPresence = new Map();
const activeCalls = new Map();
const USER_SELECT_FIELDS = "displayName avatarUrl provider lastLoginAt createdAt email";
const CALL_INVITE_TIMEOUT_MS = 40 * 1000;

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

function buildCallPeerPayload({ socket, payload, targetUserId, conversation }) {
  return {
    callId: String(payload.callId || ""),
    conversationId: String(conversation._id),
    fromUserId: String(socket.user.id),
    targetUserId: String(targetUserId),
    mode: payload.mode === "video" ? "video" : "voice",
    callerName: typeof payload.callerName === "string" ? payload.callerName : "",
    callerAvatarUrl: typeof payload.callerAvatarUrl === "string" ? payload.callerAvatarUrl : "",
    changedAt: new Date().toISOString(),
  };
}

async function getDirectCallTarget(socket, payload = {}) {
  const conversationId = String(payload.conversationId || "");
  if (!mongoose.Types.ObjectId.isValid(conversationId)) return null;

  const conversation = await Conversation.findById(conversationId).select("type participantIds unreadCounts");
  if (!conversation || conversation.type !== "direct") return null;

  const currentUserId = String(socket.user.id);
  const participantIds = conversation.participantIds.map((participantId) => String(participantId));
  if (!participantIds.includes(currentUserId)) return null;

  const targetUserId = String(payload.targetUserId || payload.toUserId || "");
  if (targetUserId) {
    if (targetUserId === currentUserId || !participantIds.includes(targetUserId)) return null;
    return { conversation, targetUserId };
  }

  const otherParticipantId = participantIds.find((participantId) => participantId !== currentUserId);
  if (!otherParticipantId) return null;

  return { conversation, targetUserId: otherParticipantId };
}

async function relayCallEvent(socket, eventName, payload = {}) {
  try {
    const target = await getDirectCallTarget(socket, payload);
    if (!target) return;

    emitToUser(target.targetUserId, eventName, {
      ...buildCallPeerPayload({
        socket,
        payload,
        targetUserId: target.targetUserId,
        conversation: target.conversation,
      }),
      offer: payload.offer || null,
      answer: payload.answer || null,
      candidate: payload.candidate || null,
    });
  } catch {
    // Call signaling is ephemeral; transient validation failures can be ignored.
  }
}

function sanitizeSocketCallMessage(message) {
  const sender = message.senderId?._id ? message.senderId : null;

  return {
    _id: String(message._id),
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: sender?._id ? String(sender._id) : String(message.senderId),
    senderName: sender?.displayName || "",
    senderAvatar: sender?.avatarUrl || "",
    text: "",
    type: "call",
    imageUrl: "",
    call: {
      callId: message.call?.callId || "",
      mode: message.call?.mode || "voice",
      status: message.call?.status || "ended",
      durationSeconds: message.call?.durationSeconds || 0,
      startedAt: message.call?.startedAt || null,
      endedAt: message.call?.endedAt || null,
    },
    isDeleted: Boolean(message.deletedAt),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function getCallPreviewText(status, durationSeconds = 0) {
  if (status === "cancelled") return "Cancelled call";
  if (status === "declined") return "Declined call";
  if (status === "missed") return "Missed call";
  if (!durationSeconds) return "Voice call";
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return minutes > 0 ? `Voice call ${minutes}m ${seconds}s` : `Voice call ${seconds}s`;
}

async function createAndEmitCallMessage(socket, payload = {}, status) {
  try {
    const callId = String(payload.callId || "");
    const target = await getDirectCallTarget(socket, payload);
    if (!callId || !target) return;

    const now = new Date();
    const activeCall = activeCalls.get(callId);
    const startedAt = activeCall?.acceptedAt || activeCall?.startedAt || now;
    const durationSeconds = status === "ended"
      ? Math.max(0, Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000))
      : 0;

    const message = await Message.create({
      conversationId: target.conversation._id,
      senderId: socket.user.id,
      type: "call",
      text: "",
      call: {
        callId,
        mode: activeCall?.mode || (payload.mode === "video" ? "video" : "voice"),
        status,
        durationSeconds,
        startedAt,
        endedAt: now,
      },
    });

    target.conversation.lastMessageId = message._id;
    target.conversation.lastMessageText = getCallPreviewText(status, durationSeconds);
    target.conversation.lastMessageSenderId = socket.user.id;
    target.conversation.lastMessageAt = message.createdAt;

    for (const participantId of target.conversation.participantIds) {
      const participantKey = String(participantId);
      if (participantKey === String(socket.user.id)) continue;

      const currentUnread = target.conversation.unreadCounts?.get(participantKey) || 0;
      target.conversation.unreadCounts.set(participantKey, currentUnread + 1);
    }

    await target.conversation.save();

    const populatedMessage = await Message.findById(message._id).populate("senderId", USER_SELECT_FIELDS);
    const sanitizedMessage = sanitizeSocketCallMessage(populatedMessage);
    const participantIds = target.conversation.participantIds.map((participantId) => String(participantId));

    for (const participantId of participantIds) {
      emitToUser(participantId, "chat:message_created", {
        conversationId: String(target.conversation._id),
        message: sanitizedMessage,
        conversation: null,
        changedAt: new Date().toISOString(),
      });
    }
  } catch {
    // Call history should not block signaling cleanup.
  }
}

function clearCallTimeout(callId) {
  const activeCall = activeCalls.get(String(callId || ""));
  if (activeCall?.timeoutId) {
    clearTimeout(activeCall.timeoutId);
  }
  return activeCall;
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

    socket.on("chat:typing", async (payload = {}) => {
      try {
        const conversationId = String(payload.conversationId || "");
        if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

        const conversation = await Conversation.findById(conversationId).select("participantIds");
        if (!conversation || !conversation.participantIds.some((participantId) => String(participantId) === String(socket.user.id))) {
          return;
        }

        for (const participantId of conversation.participantIds) {
          const targetUserId = String(participantId);
          if (targetUserId === String(socket.user.id)) continue;

          emitToUser(targetUserId, "chat:typing", {
            conversationId,
            userId: String(socket.user.id),
            isTyping: Boolean(payload.isTyping),
            changedAt: new Date().toISOString(),
          });
        }
      } catch {
        // Typing indicators are ephemeral; ignore transient socket validation failures.
      }
    });

    socket.on("call:invite", async (payload = {}) => {
      try {
        const target = await getDirectCallTarget(socket, payload);
        if (!target) return;

        const callId = String(payload.callId || "");
        if (!callId) return;

        const callPayload = {
          callId,
          conversationId: String(target.conversation._id),
          targetUserId: String(target.targetUserId),
          mode: payload.mode === "video" ? "video" : "voice",
        };
        const timeoutId = setTimeout(async () => {
          const activeCall = activeCalls.get(callId);
          if (!activeCall || activeCall.acceptedAt) return;

          await createAndEmitCallMessage(socket, callPayload, "missed");
          activeCalls.delete(callId);

          const timeoutPayload = buildCallPeerPayload({
            socket,
            payload: callPayload,
            targetUserId: target.targetUserId,
            conversation: target.conversation,
          });
          emitToUser(socket.user.id, "call:missed", timeoutPayload);
          emitToUser(target.targetUserId, "call:missed", timeoutPayload);
        }, CALL_INVITE_TIMEOUT_MS);

        activeCalls.set(callId, {
          conversationId: String(target.conversation._id),
          callerUserId: String(socket.user.id),
          calleeUserId: String(target.targetUserId),
          mode: payload.mode === "video" ? "video" : "voice",
          startedAt: new Date(),
          timeoutId,
        });

        emitToUser(target.targetUserId, "call:incoming", buildCallPeerPayload({
          socket,
          payload,
          targetUserId: target.targetUserId,
          conversation: target.conversation,
        }));
      } catch {
        // Call invites are ephemeral; ignore transient socket validation failures.
      }
    });

    socket.on("call:accept", (payload = {}) => {
      const callId = String(payload.callId || "");
      const activeCall = clearCallTimeout(callId);
      if (activeCall) {
        activeCalls.set(callId, {
          ...activeCall,
          timeoutId: null,
          acceptedAt: new Date(),
        });
      }
      relayCallEvent(socket, "call:accepted", payload);
    });

    socket.on("call:decline", async (payload = {}) => {
      clearCallTimeout(payload.callId);
      await createAndEmitCallMessage(socket, payload, "declined");
      activeCalls.delete(String(payload.callId || ""));
      relayCallEvent(socket, "call:declined", payload);
    });

    socket.on("call:cancel", async (payload = {}) => {
      clearCallTimeout(payload.callId);
      await createAndEmitCallMessage(socket, payload, "cancelled");
      activeCalls.delete(String(payload.callId || ""));
      relayCallEvent(socket, "call:cancelled", payload);
    });

    socket.on("call:end", async (payload = {}) => {
      clearCallTimeout(payload.callId);
      await createAndEmitCallMessage(socket, payload, "ended");
      activeCalls.delete(String(payload.callId || ""));
      relayCallEvent(socket, "call:ended", payload);
    });

    socket.on("call:offer", (payload = {}) => {
      relayCallEvent(socket, "call:offer", payload);
    });

    socket.on("call:answer", (payload = {}) => {
      relayCallEvent(socket, "call:answer", payload);
    });

    socket.on("call:ice_candidate", (payload = {}) => {
      relayCallEvent(socket, "call:ice_candidate", payload);
    });

    socket.on("disconnect", async () => {
      removeSocketPresence(socket);

      // ── Auto-end any active call this user was part of ──────────────
      const userId = String(socket.user.id);
      for (const [callId, activeCall] of activeCalls.entries()) {
        const isCaller = String(activeCall.callerUserId) === userId;
        const isCallee = String(activeCall.calleeUserId) === userId;
        if (!isCaller && !isCallee) continue;

        // Clear the ring / missed timeout
        if (activeCall.timeoutId) clearTimeout(activeCall.timeoutId);
        activeCalls.delete(callId);

        const peerId = isCaller ? String(activeCall.calleeUserId) : String(activeCall.callerUserId);
        // Choose status: if call was answered → "ended"; if caller drops before answer → "cancelled"; callee drops → "missed"
        const status = activeCall.acceptedAt
          ? "ended"
          : isCaller ? "cancelled" : "missed";

        const callPayload = {
          callId,
          conversationId: String(activeCall.conversationId),
          targetUserId: peerId,
          mode: activeCall.mode || "voice",
        };

        // Record call message in DB and push to all participants
        await createAndEmitCallMessage(socket, callPayload, status);

        // Notify the peer that the call ended so their overlay closes
        emitToUser(peerId, "call:ended", {
          callId,
          conversationId: String(activeCall.conversationId),
          fromUserId: userId,
        });
      }
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
