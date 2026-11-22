import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import { PUBLIC_USER_FIELDS } from "../../mappers/user.mapper.js";
import { buildConversationResult } from "./chat.mapper.js";

export function populateConversation(conversationId) {
  return Conversation.findById(conversationId).populate("participantIds", PUBLIC_USER_FIELDS);
}

/** Reloads the conversation with participants and builds the standard chat action result. */
export async function loadConversationResult(conversationId, viewerId) {
  const populatedConversation = await populateConversation(conversationId);
  return buildConversationResult(populatedConversation, viewerId);
}

export function populateMessage(messageId) {
  return Message.findById(messageId).populate("senderId", PUBLIC_USER_FIELDS);
}
