// Writes that make a new message the conversation's latest. Kept free of mapper/socket
// imports so socket.js (call messages) can use it without an import cycle.
import Conversation from "../../models/Conversation.js";
import { toIdString } from "../../utils/id.utils.js";
import { advanceReceipt, loadReceipt } from "./receipt.service.js";

/**
 * Records `message` as the conversation's latest in ONE atomic update: `$inc` on every
 * other member's unread counter (never a read-modify-write, which loses increments when
 * two messages are sent at once) together with the move of `lastMessageId` that
 * markConversationRead's compare-and-set watches. The sender is replying, so their own
 * counter goes to 0.
 */
export async function recordLatestMessage(conversation, message, senderId, previewText) {
  const senderKey = toIdString(senderId);
  const increments = {};
  for (const participantId of conversation.participantIds) {
    const participantKey = toIdString(participantId);
    if (participantKey !== senderKey) increments[`unreadCounts.${participantKey}`] = 1;
  }

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessageId: message._id,
        lastMessageText: previewText,
        lastMessageSenderId: senderId,
        lastMessageAt: message.createdAt,
        [`unreadCounts.${senderKey}`]: 0,
      },
      ...(Object.keys(increments).length > 0 && { $inc: increments }),
    },
  );

  // Sending implies having read everything up to your own message.
  const moved = await advanceReceipt(conversation._id, senderId, message, "read");
  return moved ? (await loadReceipt(conversation._id, senderId))?.receipt || null : null;
}
