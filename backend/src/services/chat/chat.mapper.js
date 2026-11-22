// Converts Conversation / Message documents into the JSON shapes sent to clients.
import { sanitizeUser } from "../../mappers/user.mapper.js";
import { getUserPresence } from "../../socket.js";
import { toIdString } from "../../utils/id.utils.js";
import { encodeKeysetCursor } from "../../utils/pagination.utils.js";
import { serializeReceipt } from "./receipt.service.js";

function getOtherParticipant(conversation, currentUserId) {
  const currentId = toIdString(currentUserId);
  return conversation.participantIds.find((participant) => toIdString(participant) !== currentId);
}

function sanitizeCall(call) {
  return {
    callId: call?.callId || "",
    mode: call?.mode || "voice",
    status: call?.status || "ended",
    durationSeconds: call?.durationSeconds || 0,
    startedAt: call?.startedAt || null,
    endedAt: call?.endedAt || null,
  };
}

export function sanitizeMessage(message) {
  const sender = message.senderId?._id ? sanitizeUser(message.senderId) : null;

  return {
    _id: String(message._id),
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: sender?.id ? String(sender.id) : String(message.senderId),
    senderName: sender?.displayName || "",
    senderAvatar: sender?.avatarUrl || "",
    text: message.deletedAt ? "" : message.text,
    type: message.type || (message.imageUrl ? "image" : "text"),
    imageUrl: message.deletedAt ? "" : message.imageUrl,
    call: message.type === "call" && !message.deletedAt ? sanitizeCall(message.call) : null,
    isDeleted: Boolean(message.deletedAt),
    /** The sender's idempotency key, so their client can match it to its pending copy. */
    clientMessageId: message.clientMessageId || null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    /** Opaque position in the timeline; pass it as `before`/`after` to page from here. */
    cursor: encodeKeysetCursor(message.createdAt, message._id),
  };
}

/**
 * A conversation as seen by `currentUserId`: a direct chat shows the other user's
 * name/avatar/presence, and messages from before the user hid it are not previewed.
 * Expects participantIds to be populated.
 */
export function sanitizeConversation(conversation, currentUserId) {
  const currentId = toIdString(currentUserId);
  const isDirect = conversation.type === "direct";
  const hiddenAt = conversation.hiddenBy?.get?.(currentId);
  const hasVisibleLastMessage = conversation.lastMessageAt
    && (!hiddenAt || new Date(conversation.lastMessageAt).getTime() > new Date(hiddenAt).getTime());
  const otherParticipant = isDirect ? getOtherParticipant(conversation, currentUserId) : null;
  const otherUser = otherParticipant?._id ? sanitizeUser(otherParticipant) : null;
  const otherUserPresence = otherUser?.id ? getUserPresence(otherUser.id) : null;
  const displayName = isDirect
    ? otherUser?.displayName || "Unknown user"
    : conversation.name || "Group chat";
  const avatarUrl = isDirect
    ? otherUser?.avatarUrl || ""
    : conversation.avatarUrl || "";
  const members = conversation.participantIds
    .filter((participant) => participant?._id)
    .map((participant) => sanitizeUser(participant));

  return {
    id: String(conversation._id),
    conversationId: String(conversation._id),
    type: conversation.type,
    name: displayName,
    profilePic: avatarUrl,
    avatarUrl,
    friendId: otherUser?.id ? String(otherUser.id) : null,
    ownerId: conversation.createdById ? String(conversation.createdById) : null,
    presenceStatus: isDirect ? otherUserPresence?.status || "offline" : "",
    lastActiveAt: isDirect ? otherUserPresence?.lastActiveAt || null : null,
    participants: members,
    members,
    memberCount: conversation.participantIds?.length || 0,
    preview: hasVisibleLastMessage ? conversation.lastMessageText || "No messages yet" : "No messages yet",
    lastMessageSenderId: hasVisibleLastMessage && conversation.lastMessageSenderId
      ? String(conversation.lastMessageSenderId)
      : null,
    time: hasVisibleLastMessage ? conversation.lastMessageAt : null,
    unread: conversation.unreadCounts?.get?.(currentId) || 0,
    /** Every member's delivery / read watermark, for message status ticks. */
    receipts: (conversation.participantIds || []).map((participant) => {
      const memberId = toIdString(participant?._id || participant);
      return serializeReceipt(memberId, conversation.receipts?.get?.(memberId));
    }),
    lastMessageAt: hasVisibleLastMessage ? conversation.lastMessageAt : null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

/** One sanitized copy of the conversation per participant, keyed by user id (for socket pushes). */
export function buildConversationPayloadsByUser(conversation) {
  return Object.fromEntries(
    conversation.participantIds
      .filter((participant) => participant?._id)
      .map((participant) => {
        const participantId = String(participant._id);
        return [participantId, sanitizeConversation(conversation, participantId)];
      }),
  );
}

/**
 * The `{ conversation, conversationsByUserId, participantIds }` bundle that chat actions
 * return so the controller can answer the caller and notify every participant.
 */
export function buildConversationResult(populatedConversation, viewerId) {
  return {
    conversation: sanitizeConversation(populatedConversation, viewerId),
    conversationsByUserId: buildConversationPayloadsByUser(populatedConversation),
    participantIds: populatedConversation.participantIds.map((participant) => String(participant._id)),
  };
}
