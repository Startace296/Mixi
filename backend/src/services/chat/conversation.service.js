// Conversation list and per-user conversation state (direct chats, read, hide).
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import User from "../../models/User.js";
import { PUBLIC_USER_FIELDS } from "../../mappers/user.mapper.js";
import { AppError } from "../../utils/app-error.js";
import { assertObjectId, toIdString } from "../../utils/id.utils.js";
import { parseLimit } from "../../utils/pagination.utils.js";
import { findAcceptedRelations, getOtherUserId } from "../friend/friendship.queries.js";
import { buildDirectPairKey, ensureAcceptedFriendship, getParticipantConversation } from "./chat.guards.js";
import { sanitizeConversation } from "./chat.mapper.js";
import { loadConversationResult } from "./chat.queries.js";
import { advanceReceipt, isCoveredByReceipt, loadReceipt } from "./receipt.service.js";

const DEFAULT_CONVERSATION_LIMIT = 50;
const MAX_CONVERSATION_LIMIT = 100;
/** The badge shows "99+" anyway; counting further is wasted index reads. */
const MAX_COUNTED_UNREAD = 1000;
/** Each retry means a message arrived mid-read; a handful covers any realistic burst. */
const MAX_READ_CAS_ATTEMPTS = 5;

function createDirectConversation(pairKey, createdById) {
  return {
    type: "direct",
    participantIds: pairKey.split(":"),
    pairKey,
    createdById,
  };
}

/** Every accepted friend gets a direct conversation, even before the first message. */
async function ensureDirectConversationsForFriends(currentUserId) {
  const acceptedRelations = await findAcceptedRelations(currentUserId).select("requestedById receiverId");
  const existingDirectConversations = await Conversation.find({
    type: "direct",
    participantIds: currentUserId,
  }).select("pairKey");
  const existingPairKeys = new Set(existingDirectConversations.map((conversation) => conversation.pairKey));

  for (const relation of acceptedRelations) {
    const pairKey = buildDirectPairKey(currentUserId, getOtherUserId(relation, currentUserId));
    if (existingPairKeys.has(pairKey)) continue;

    await Conversation.create(createDirectConversation(pairKey, currentUserId));
    existingPairKeys.add(pairKey);
  }
}

/** A hidden conversation shows up again only once there is activity after it was hidden. */
function isVisibleTo(conversation, currentId) {
  const hiddenAt = conversation.hiddenBy?.get?.(currentId);
  if (!hiddenAt) return true;

  const latestActivity = conversation.lastMessageAt || conversation.updatedAt;
  return latestActivity && new Date(latestActivity).getTime() > new Date(hiddenAt).getTime();
}

export async function getOrCreateDirectConversation(currentUserId, friendId) {
  await ensureAcceptedFriendship(currentUserId, friendId);

  const friend = await User.findById(friendId).select(PUBLIC_USER_FIELDS);
  if (!friend) {
    throw new AppError("User not found", 404);
  }

  const pairKey = buildDirectPairKey(currentUserId, friendId);
  const conversation = await Conversation.findOneAndUpdate(
    { type: "direct", pairKey },
    { $setOnInsert: createDirectConversation(pairKey, currentUserId) },
    {
      returnDocument: "after",
      upsert: true,
    },
  ).populate("participantIds", PUBLIC_USER_FIELDS);

  return sanitizeConversation(conversation, currentUserId);
}

export async function listConversations(currentUserId, rawLimit = DEFAULT_CONVERSATION_LIMIT) {
  const limit = parseLimit(rawLimit, DEFAULT_CONVERSATION_LIMIT, MAX_CONVERSATION_LIMIT);
  const currentId = toIdString(currentUserId);

  await ensureDirectConversationsForFriends(currentUserId);

  const conversations = await Conversation.find({
    participantIds: currentUserId,
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(limit)
    .populate("participantIds", PUBLIC_USER_FIELDS);

  const visible = conversations.filter((conversation) => isVisibleTo(conversation, currentId));
  const deliveredReceipts = await markLatestMessagesDelivered(visible, currentUserId);

  return {
    conversations: visible.map((conversation) => sanitizeConversation(conversation, currentUserId)),
    deliveredReceipts,
  };
}

/**
 * Loading the list puts every conversation's latest message on this device, so that is
 * a delivery. Only conversations whose watermark is actually behind are written (in
 * memory check first), and each write is still the conditional, forward-only update.
 * The in-memory copies are patched so the response already shows the new state.
 */
async function markLatestMessagesDelivered(conversations, currentUserId) {
  const currentId = toIdString(currentUserId);
  const behind = conversations.filter((conversation) => {
    if (!conversation.lastMessageId || toIdString(conversation.lastMessageSenderId) === currentId) return false;
    const latest = { _id: conversation.lastMessageId, createdAt: conversation.lastMessageAt };
    return !isCoveredByReceipt(conversation.receipts?.get(currentId), "delivered", latest);
  });

  const results = await Promise.all(behind.map(async (conversation) => {
    const latest = { _id: conversation.lastMessageId, createdAt: conversation.lastMessageAt };
    const moved = await advanceReceipt(conversation._id, currentUserId, latest, "delivered");
    if (!moved) return null;

    const receiptResult = await loadReceipt(conversation._id, currentUserId);
    if (receiptResult) {
      const current = conversation.receipts.get(currentId)?.toObject?.() || {};
      conversation.receipts.set(currentId, {
        ...current,
        deliveredAt: receiptResult.receipt.deliveredAt,
        deliveredMessageId: receiptResult.receipt.deliveredMessageId,
      });
    }
    return receiptResult && { conversationId: toIdString(conversation._id), ...receiptResult };
  }));

  return results.filter(Boolean);
}

/**
 * Unread messages for `userId` strictly after `fromKey` and up to `toKey` (both
 * (createdAt, _id) keys), not counting their own or deleted ones.
 */
function countUnreadBetween(conversationId, userId, { fromKey, toKey, hiddenAt }) {
  const conditions = [
    {
      createdAt: { $lte: toKey.createdAt },
      $or: [{ createdAt: { $lt: toKey.createdAt } }, { _id: { $lte: toKey._id } }],
    },
  ];
  if (fromKey) {
    conditions.push({
      createdAt: { $gte: fromKey.createdAt },
      $or: [{ createdAt: { $gt: fromKey.createdAt } }, { _id: { $gt: fromKey._id } }],
    });
  }
  if (hiddenAt) conditions.push({ createdAt: { $gt: hiddenAt } });

  return Message.countDocuments(
    { conversationId, senderId: { $ne: userId }, deletedAt: null, $and: conditions },
    { limit: MAX_COUNTED_UNREAD },
  );
}

/**
 * Marks the conversation read up to `upToMessageId` (default: its latest message).
 *
 * Read the latest message the client actually saw, not "whatever is newest now": a
 * message landing while the request is in flight must stay unread.
 *
 * The unread counter is recomputed from the read watermark with compare-and-set on
 * `lastMessageId`: sendMessage bumps the counter in the same atomic update that moves
 * `lastMessageId`, so if a send slips in between our count and our write, the write
 * matches nothing and we recount instead of overwriting that increment.
 */
export async function markConversationRead(currentUserId, conversationId, { upToMessageId } = {}) {
  const conversation = await getParticipantConversation(conversationId, currentUserId);
  const currentId = toIdString(currentUserId);
  const previousUnread = conversation.unreadCounts?.get(currentId) || 0;

  let target = null;
  const targetId = upToMessageId || conversation.lastMessageId;
  if (targetId) {
    assertObjectId(targetId, "Invalid message id");
    target = await Message.findOne({ _id: targetId, conversationId: conversation._id }).select("createdAt");
    if (!target && upToMessageId) throw new AppError("Message not found", 404);
  }
  const receiptMoved = target ? await advanceReceipt(conversation._id, currentUserId, target, "read") : false;

  let unread = previousUnread;
  for (let attempt = 0; attempt < MAX_READ_CAS_ATTEMPTS; attempt += 1) {
    const latest = await Conversation.findById(conversation._id).select("lastMessageId lastMessageAt receipts hiddenBy");
    const receipt = latest.receipts?.get(currentId);
    const readKey = receipt?.readAt ? { createdAt: receipt.readAt, _id: receipt.readMessageId } : null;

    if (!latest.lastMessageId) {
      unread = 0;
    } else if (readKey && String(readKey._id) === String(latest.lastMessageId)) {
      unread = 0;
    } else {
      unread = await countUnreadBetween(conversation._id, currentUserId, {
        fromKey: readKey,
        toKey: { createdAt: latest.lastMessageAt, _id: latest.lastMessageId },
        hiddenAt: latest.hiddenBy?.get?.(currentId),
      });
    }

    const written = await Conversation.updateOne(
      { _id: conversation._id, lastMessageId: latest.lastMessageId },
      { $set: { [`unreadCounts.${currentId}`]: unread } },
    );
    if (written.matchedCount > 0) break;
  }

  const receiptResult = await loadReceipt(conversation._id, currentUserId);
  return {
    ...(await loadConversationResult(conversationId, currentUserId)),
    readChanged: previousUnread !== unread || receiptMoved,
    receipt: receiptMoved ? receiptResult?.receipt || null : null,
  };
}

export async function hideConversation(currentUserId, conversationId) {
  const conversation = await getParticipantConversation(conversationId, currentUserId);

  conversation.hiddenBy.set(toIdString(currentUserId), new Date());
  conversation.unreadCounts.set(toIdString(currentUserId), 0);
  await conversation.save();

  return {
    conversationId: String(conversation._id),
  };
}
