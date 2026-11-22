// Messages inside a conversation: list (paged), send text/image, delete.
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import { PUBLIC_USER_FIELDS } from "../../mappers/user.mapper.js";
import { isAllowedImageType, uploadChatImage } from "../../lib/image-upload.js";
import { AppError } from "../../utils/app-error.js";
import { assertObjectId, toIdString } from "../../utils/id.utils.js";
import { buildKeysetFilter, decodeKeysetCursor, parseDateCursor, parseLimit } from "../../utils/pagination.utils.js";
import { toTrimmedString } from "../../utils/text.utils.js";
import { getParticipantConversation, isSameUser } from "./chat.guards.js";
import { buildConversationPayloadsByUser, sanitizeConversation, sanitizeMessage } from "./chat.mapper.js";
import { loadConversationResult, populateConversation, populateMessage } from "./chat.queries.js";
import { markConversationRead } from "./conversation.service.js";
import { recordLatestMessage } from "./latest-message.js";

const DEFAULT_MESSAGE_LIMIT = 50;
const MAX_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 4000;
const DELETED_MESSAGE_PREVIEW = "This message was deleted";
/** Most deletions one sync reports; past this the client reloads the newest page instead. */
const MAX_DELETED_IDS = 500;
/**
 * `deletedAt` comes from whichever app instance handled the delete, `serverTime` from
 * the one answering this request. Looking back a little further absorbs clock skew
 * between them; reporting a deletion twice is harmless.
 */
const DELETED_SINCE_SKEW_MS = 5000;

/**
 * Resolves `?before=` / `?after=` into a keyset cursor. `before` also accepts a plain
 * ISO date, the format older clients still send.
 */
function parseMessageCursor({ before, after }) {
  if (before && after) {
    throw new AppError("Use either before or after, not both", 400);
  }

  const raw = before || after;
  if (!raw) return null;

  const direction = before ? "before" : "after";
  const cursor = decodeKeysetCursor(raw);
  if (cursor) return { direction, cursor };

  if (direction === "before") {
    return { direction, cursor: { createdAt: parseDateCursor(raw, "Invalid message cursor"), id: null } };
  }
  throw new AppError("Invalid message cursor", 400);
}

/**
 * Ids of messages deleted after `since`, so a client holding an old copy of the
 * timeline can blank them. Served by the partial `conversation_deleted` index, which
 * only holds deleted messages; the `$type` condition is what lets the planner use it.
 */
async function listDeletedSince(conversationId, since) {
  const rows = await Message.find({
    conversationId,
    deletedAt: { $type: "date", $gt: new Date(since.getTime() - DELETED_SINCE_SKEW_MS) },
  })
    .select("_id")
    .limit(MAX_DELETED_IDS + 1)
    .lean();

  return {
    deletedMessageIds: rows.slice(0, MAX_DELETED_IDS).map((row) => String(row._id)),
    deletedTruncated: rows.length > MAX_DELETED_IDS,
  };
}

/**
 * One page of a conversation's timeline, always returned oldest -> newest.
 *
 * - no cursor: the newest `limit` messages (opening the chat).
 * - `before`:  the `limit` messages just older than the cursor (infinite scroll up).
 * - `after`:   the `limit` messages just newer than the cursor (catching up after a
 *              reconnect or when reopening a cached chat).
 *
 * Pages are keyset-paginated on (createdAt, _id), served by the
 * { conversationId, createdAt: -1, _id: -1 } index without an in-memory sort.
 * Only pages that reach the newest messages mark the conversation read; scrolling
 * back through history does not.
 *
 * `deletedSince` (a `serverTime` from an earlier response) also returns the ids of
 * messages deleted since then, for clients that missed the socket events.
 */
export async function listMessages(
  currentUserId,
  conversationId,
  { limit: rawLimit, before, after, deletedSince } = {},
) {
  // Taken before any read, so a deletion racing this request is reported next time.
  const serverTime = new Date();
  const limit = parseLimit(rawLimit, DEFAULT_MESSAGE_LIMIT, MAX_MESSAGE_LIMIT);
  const page = parseMessageCursor({ before, after });
  const deletedSinceDate = deletedSince ? parseDateCursor(deletedSince, "Invalid deletedSince") : null;
  const conversation = await getParticipantConversation(conversationId, currentUserId, "participantIds hiddenBy");

  const conditions = [];
  if (page) {
    conditions.push(buildKeysetFilter(page.cursor, page.direction));
  }

  // Messages from before the user hid the conversation stay hidden.
  const hiddenAt = conversation.hiddenBy?.get?.(toIdString(currentUserId));
  if (hiddenAt) {
    conditions.push({ createdAt: { $gt: hiddenAt } });
  }

  const isForward = page?.direction === "after";
  const sortOrder = isForward ? 1 : -1;
  const messages = await Message.find({
    conversationId: conversation._id,
    ...(conditions.length > 0 && { $and: conditions }),
  })
    .sort({ createdAt: sortOrder, _id: sortOrder })
    .limit(limit + 1)
    .populate("senderId", PUBLIC_USER_FIELDS);

  // One extra row was fetched to learn whether another page exists in this direction.
  const hasMoreInDirection = messages.length > limit;
  const pageMessages = hasMoreInDirection ? messages.slice(0, limit) : messages;
  const orderedMessages = (isForward ? pageMessages : pageMessages.reverse()).map(sanitizeMessage);

  // A `before` page always has the cursor's message (or newer ones) after it; an
  // `after` page always has the cursor's message before it.
  const hasOlder = isForward ? true : hasMoreInDirection;
  const hasNewer = isForward ? hasMoreInDirection : Boolean(page);
  const startCursor = orderedMessages[0]?.cursor || null;
  const endCursor = orderedMessages[orderedMessages.length - 1]?.cursor || null;

  const deletions = deletedSinceDate ? await listDeletedSince(conversation._id, deletedSinceDate) : null;

  const reachesNewest = !hasNewer;
  // Read up to the newest message this response shows (or the catch-up cursor if it
  // shows none), not whatever is newest by the time the write happens.
  const readUpTo = orderedMessages[orderedMessages.length - 1]?.id || page?.cursor?.id || null;
  const readResult = reachesNewest
    ? await markConversationRead(currentUserId, conversationId, { upToMessageId: readUpTo ? String(readUpTo) : undefined })
    : null;

  return {
    messages: orderedMessages,
    readConversation: readResult?.conversation || null,
    readChanged: Boolean(readResult?.readChanged),
    conversationsByUserId: readResult?.conversationsByUserId || {},
    participantIds: readResult?.participantIds || [],
    readReceipt: readResult?.receipt || null,
    serverTime: serverTime.toISOString(),
    ...(deletions || {}),
    pageInfo: {
      hasOlder,
      hasNewer,
      startCursor,
      endCursor,
      // Legacy names, kept so clients built before keyset cursors keep paging.
      hasMore: hasOlder,
      nextBefore: startCursor,
    },
  };
}

const CLIENT_MESSAGE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const DUPLICATE_KEY_ERROR = 11000;

function parseClientMessageId(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !CLIENT_MESSAGE_ID_PATTERN.test(value)) {
    throw new AppError("Invalid clientMessageId", 400);
  }
  return value;
}

/**
 * The message already stored under this sender's idempotency key, if any. A key reused
 * for a different conversation is a client bug, not a retry.
 */
async function findSentMessage(currentUserId, conversationId, clientMessageId) {
  if (!clientMessageId) return null;
  const existing = await Message.findOne({ senderId: currentUserId, clientMessageId });
  if (existing && toIdString(existing.conversationId) !== toIdString(conversationId)) {
    throw new AppError("clientMessageId was already used in another conversation", 409);
  }
  return existing;
}

/**
 * Result for a retried send whose first attempt already stored the message. That first
 * attempt did (or is doing) the side effects (counters, receipts, socket events), so
 * the retry only reports the message; `duplicate` tells the controller not to re-emit.
 */
async function buildDuplicateSendResult(existing, conversationId, currentUserId) {
  const populated = await populateMessage(existing._id);
  return {
    message: sanitizeMessage(populated),
    senderReceipt: null,
    duplicate: true,
    ...(await loadConversationResult(conversationId, currentUserId)),
  };
}

/**
 * Stores a message. With `clientMessageId` the send is idempotent: retries, even ones
 * racing the original request, yield exactly one message. The unique index is the
 * arbiter; the lookup before insert only avoids the error in the common case.
 */
export async function sendMessage(currentUserId, conversationId, { text = "", imageUrl = "", clientMessageId } = {}) {
  assertObjectId(conversationId, "Invalid conversation id");
  const idempotencyKey = parseClientMessageId(clientMessageId);

  const cleanText = toTrimmedString(text);
  const cleanImageUrl = toTrimmedString(imageUrl);

  if (!cleanText && !cleanImageUrl) {
    throw new AppError("Message text or image is required", 400);
  }

  if (cleanText.length > MAX_MESSAGE_LENGTH) {
    throw new AppError("Message must be at most 4000 characters long", 400);
  }

  const conversation = await getParticipantConversation(conversationId, currentUserId);

  const alreadySent = await findSentMessage(currentUserId, conversationId, idempotencyKey);
  if (alreadySent) return buildDuplicateSendResult(alreadySent, conversationId, currentUserId);

  let message;
  try {
    message = await Message.create({
      conversationId,
      senderId: currentUserId,
      text: cleanText,
      type: cleanImageUrl ? "image" : "text",
      imageUrl: cleanImageUrl,
      clientMessageId: idempotencyKey,
    });
  } catch (err) {
    // Lost the race to a concurrent attempt with the same key: that one is the message.
    if (err?.code !== DUPLICATE_KEY_ERROR || !idempotencyKey) throw err;
    const winner = await findSentMessage(currentUserId, conversationId, idempotencyKey);
    return buildDuplicateSendResult(winner, conversationId, currentUserId);
  }

  const senderReceipt = await recordLatestMessage(conversation, message, currentUserId, cleanText || "Image");

  const populatedMessage = await populateMessage(message._id);

  return {
    message: sanitizeMessage(populatedMessage),
    senderReceipt,
    ...(await loadConversationResult(conversationId, currentUserId)),
  };
}

export async function sendChatImage(currentUserId, conversationId, file, { clientMessageId } = {}) {
  const idempotencyKey = parseClientMessageId(clientMessageId);
  if (!file?.buffer) {
    throw new AppError("Image file is required", 400);
  }

  if (!isAllowedImageType(file)) {
    throw new AppError("Only PNG and JPEG images are allowed", 400);
  }

  // A retry of an upload that already went through must not upload the image again.
  if (idempotencyKey) {
    assertObjectId(conversationId, "Invalid conversation id");
    await getParticipantConversation(conversationId, currentUserId, "participantIds");
    const alreadySent = await findSentMessage(currentUserId, conversationId, idempotencyKey);
    if (alreadySent) return buildDuplicateSendResult(alreadySent, conversationId, currentUserId);
  }

  const result = await uploadChatImage(file.buffer);
  if (!result?.secure_url) {
    throw new AppError("Failed to upload image", 500);
  }

  return sendMessage(currentUserId, conversationId, {
    imageUrl: result.secure_url,
    clientMessageId: idempotencyKey,
  });
}

/** Soft delete: the message stays (as "deleted") so the timeline keeps its shape. */
export async function deleteMessage(currentUserId, messageId) {
  assertObjectId(messageId, "Invalid message id");

  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError("Message not found", 404);
  }

  if (!isSameUser(message.senderId, currentUserId)) {
    throw new AppError("You can only delete your own messages", 403);
  }

  message.deletedAt = new Date();
  message.text = "";
  message.imageUrl = "";
  await message.save();

  const latestMessage = await Message.findOne({
    conversationId: message.conversationId,
  }).sort({ createdAt: -1, _id: -1 });

  if (latestMessage && isSameUser(latestMessage._id, message._id)) {
    await Conversation.findByIdAndUpdate(message.conversationId, {
      lastMessageId: message._id,
      lastMessageText: DELETED_MESSAGE_PREVIEW,
      lastMessageSenderId: message.senderId,
      lastMessageAt: message.createdAt,
    });
  }

  // The conversation may be gone (e.g. group deleted meanwhile), hence the fallbacks.
  const conversation = await populateConversation(message.conversationId);

  return {
    message: sanitizeMessage(message),
    conversation: conversation ? sanitizeConversation(conversation, currentUserId) : null,
    conversationsByUserId: conversation ? buildConversationPayloadsByUser(conversation) : {},
    participantIds: conversation?.participantIds.map((participantId) => toIdString(participantId)) || [],
  };
}
