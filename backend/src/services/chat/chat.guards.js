// Lookups that load a conversation and check the caller is allowed to act on it.
import Conversation from "../../models/Conversation.js";
import { AppError } from "../../utils/app-error.js";
import { assertObjectId, toIdString } from "../../utils/id.utils.js";
import { findAcceptedRelationBetween } from "../friend/friendship.queries.js";

/** Direct chats are keyed by "lowId:highId" so each pair of users has exactly one. */
export function buildDirectPairKey(leftId, rightId) {
  const left = toIdString(leftId);
  const right = toIdString(rightId);

  if (left === right) {
    throw new AppError("You cannot start a conversation with yourself", 400);
  }

  return [left, right].sort().join(":");
}

export function isParticipant(conversation, userId) {
  const currentId = toIdString(userId);
  return conversation.participantIds.some((participantId) => toIdString(participantId) === currentId);
}

export function isSameUser(leftId, rightId) {
  return toIdString(leftId) === toIdString(rightId);
}

/** Loads a conversation the user belongs to, or throws 404. `select` limits the loaded fields. */
export async function getParticipantConversation(conversationId, userId, select) {
  assertObjectId(conversationId, "Invalid conversation id");

  const query = Conversation.findById(conversationId);
  const conversation = await (select ? query.select(select) : query);
  if (!conversation || !isParticipant(conversation, userId)) {
    throw new AppError("Conversation not found", 404);
  }

  return conversation;
}

/** Loads a group conversation the user belongs to, or throws 404. */
export async function getGroupConversation(conversationId, userId) {
  assertObjectId(conversationId, "Invalid conversation id");

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.type !== "group" || !isParticipant(conversation, userId)) {
    throw new AppError("Group conversation not found", 404);
  }

  return conversation;
}

export function assertGroupOwner(conversation, userId) {
  if (!isSameUser(conversation.createdById, userId)) {
    throw new AppError("Only the group owner can perform this action", 403);
  }
}

/** Only accepted friends can be messaged or added to a group. */
export async function ensureAcceptedFriendship(currentUserId, friendId) {
  assertObjectId(friendId, "Invalid friend id");
  buildDirectPairKey(currentUserId, friendId); // rejects messaging yourself

  const relation = await findAcceptedRelationBetween(currentUserId, friendId);
  if (!relation) {
    throw new AppError("You can only message accepted friends", 403);
  }
}
