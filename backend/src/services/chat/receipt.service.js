// Delivery / read receipts as per-member watermarks on the conversation timeline.
//
// Concurrency model: every write here is a single conditional update that only moves a
// watermark *forward*. Acks may arrive late, out of order, twice, or from several tabs
// at once; whichever update names the furthest message wins and the others match
// nothing. No read-modify-write, no locks.
import mongoose from "mongoose";

import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import { toIdString } from "../../utils/id.utils.js";

export const RECEIPT_KINDS = {
  delivered: { atField: "deliveredAt", idField: "deliveredMessageId" },
  read: { atField: "readAt", idField: "readMessageId" },
};

function toObjectId(value) {
  return value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value));
}

/**
 * Atomically moves `userId`'s `kind` watermark to `message` if, and only if, that is
 * further along than where it is now. Returns whether it moved.
 */
async function advanceWatermark(conversationId, userId, kind, message) {
  const { atField, idField } = RECEIPT_KINDS[kind];
  const memberKey = toIdString(userId);
  const atPath = `receipts.${memberKey}.${atField}`;
  const idPath = `receipts.${memberKey}.${idField}`;
  const messageId = toObjectId(message._id);

  const result = await Conversation.updateOne(
    {
      _id: conversationId,
      participantIds: toObjectId(userId),
      $or: [
        { [atPath]: null }, // never set (missing or null)
        { [atPath]: { $lt: message.createdAt } },
        { [atPath]: message.createdAt, [idPath]: { $lt: messageId } },
      ],
    },
    { $set: { [atPath]: message.createdAt, [idPath]: messageId } },
  );
  return result.modifiedCount > 0;
}

/**
 * Moves the member's watermarks up to `message`. Reading implies delivery, so a read
 * also advances delivery; delivery is written first so no reader ever observes
 * "read but not delivered".
 */
export async function advanceReceipt(conversationId, userId, message, kind) {
  const deliveredMoved = await advanceWatermark(conversationId, userId, "delivered", message);
  const readMoved = kind === "read" ? await advanceWatermark(conversationId, userId, "read", message) : false;
  return deliveredMoved || readMoved;
}

/** Wire shape of one member's watermarks. Clients compare (at, messageId) pairs. */
export function serializeReceipt(userId, receipt) {
  return {
    userId: toIdString(userId),
    deliveredAt: receipt?.deliveredAt || null,
    deliveredMessageId: receipt?.deliveredMessageId ? toIdString(receipt.deliveredMessageId) : null,
    readAt: receipt?.readAt || null,
    readMessageId: receipt?.readMessageId ? toIdString(receipt.readMessageId) : null,
  };
}

/** Current watermarks of `userId` plus the members to notify, after a change. */
export async function loadReceipt(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId).select("participantIds receipts");
  if (!conversation) return null;
  return {
    receipt: serializeReceipt(userId, conversation.receipts?.get(toIdString(userId))),
    participantIds: conversation.participantIds.map(toIdString),
  };
}

/**
 * A member's client says it has received (or read) `messageId`. The message must
 * belong to the conversation, so a client cannot push a watermark past real messages.
 * Returns null when nothing changed (unknown message, not a member, or already past it).
 */
export async function recordReceipt(userId, conversationId, messageId, kind) {
  if (!RECEIPT_KINDS[kind]) return null;
  if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(messageId)) return null;

  const message = await Message.findOne({ _id: messageId, conversationId }).select("createdAt");
  if (!message) return null;

  const moved = await advanceReceipt(conversationId, userId, message, kind);
  if (!moved) return null;
  return loadReceipt(conversationId, userId);
}

/** True if `message` is at or before the member's `kind` watermark. */
export function isCoveredByReceipt(receipt, kind, message) {
  const { atField, idField } = RECEIPT_KINDS[kind];
  const at = receipt?.[atField];
  if (!at || !message?.createdAt) return false;
  const watermarkTime = new Date(at).getTime();
  const messageTime = new Date(message.createdAt).getTime();
  if (messageTime !== watermarkTime) return messageTime < watermarkTime;
  return toIdString(message._id) <= toIdString(receipt[idField]);
}
