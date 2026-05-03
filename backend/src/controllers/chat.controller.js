import {
  deleteMessage,
  getOrCreateDirectConversation,
  hideConversation,
  listConversations,
  listMessages,
  markConversationRead,
  sendChatImage,
  sendMessage,
} from "../services/chat.service.js";
import { emitToUser } from "../socket.js";

function emitChatEvent(participantIds, eventName, payload) {
  for (const participantId of participantIds) {
    emitToUser(participantId, eventName, {
      ...payload,
      changedAt: new Date().toISOString(),
    });
  }
}

/** GET /chat/conversations */
export async function getConversationsHandler(req, res) {
  const conversations = await listConversations(req.user.id, req.query.limit);

  res.json({
    success: true,
    conversations,
  });
}

/** POST /chat/conversations/direct/:friendId */
export async function createDirectConversationHandler(req, res) {
  const conversation = await getOrCreateDirectConversation(req.user.id, req.params.friendId);

  res.status(201).json({
    success: true,
    conversation,
  });
}

/** GET /chat/conversations/:conversationId/messages */
export async function getMessagesHandler(req, res) {
  const result = await listMessages(req.user.id, req.params.conversationId, req.query);

  res.json({
    success: true,
    messages: result.messages,
    pageInfo: result.pageInfo,
  });
}

/** POST /chat/conversations/:conversationId/messages */
export async function sendMessageHandler(req, res) {
  const result = await sendMessage(req.user.id, req.params.conversationId, req.body);

  emitChatEvent(result.participantIds, "chat:message_created", {
    conversationId: result.conversation.id,
    message: result.message,
    conversation: result.conversation,
  });

  res.status(201).json({
    success: true,
    message: result.message,
    conversation: result.conversation,
  });
}

/** POST /chat/conversations/:conversationId/images */
export async function sendImageMessageHandler(req, res) {
  const result = await sendChatImage(req.user.id, req.params.conversationId, req.file);

  emitChatEvent(result.participantIds, "chat:message_created", {
    conversationId: result.conversation.id,
    message: result.message,
    conversation: result.conversation,
  });

  res.status(201).json({
    success: true,
    message: result.message,
    conversation: result.conversation,
  });
}

/** PATCH /chat/conversations/:conversationId/read */
export async function markConversationReadHandler(req, res) {
  const result = await markConversationRead(req.user.id, req.params.conversationId);

  emitChatEvent(result.participantIds, "chat:conversation_read", {
    conversationId: result.conversation.id,
    userId: String(req.user.id),
    conversation: result.conversation,
  });

  res.json({
    success: true,
    conversation: result.conversation,
  });
}

/** PATCH /chat/conversations/:conversationId/hide */
export async function hideConversationHandler(req, res) {
  const result = await hideConversation(req.user.id, req.params.conversationId);

  res.json({
    success: true,
    conversationId: result.conversationId,
  });
}

/** DELETE /chat/messages/:messageId */
export async function deleteMessageHandler(req, res) {
  const result = await deleteMessage(req.user.id, req.params.messageId);

  emitChatEvent(result.participantIds, "chat:message_deleted", {
    conversationId: result.message.conversationId,
    message: result.message,
  });

  res.json({
    success: true,
    message: result.message,
  });
}
