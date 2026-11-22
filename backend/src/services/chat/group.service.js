// Group chats: create, rename / change avatar, manage members, leave, delete.
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import User from "../../models/User.js";
import { uploadGroupAvatar } from "../../lib/image-upload.js";
import { AppError } from "../../utils/app-error.js";
import { assertObjectId, toIdString } from "../../utils/id.utils.js";
import { toTrimmedString } from "../../utils/text.utils.js";
import {
  assertGroupOwner,
  ensureAcceptedFriendship,
  getGroupConversation,
  isSameUser,
} from "./chat.guards.js";
import { buildConversationResult } from "./chat.mapper.js";
import { loadConversationResult, populateConversation } from "./chat.queries.js";

const MAX_GROUP_NAME_LENGTH = 80;

function cleanGroupName(name) {
  const cleanName = toTrimmedString(name);
  if (!cleanName) {
    throw new AppError("Group name is required", 400);
  }
  if (cleanName.length > MAX_GROUP_NAME_LENGTH) {
    throw new AppError("Group name must be at most 80 characters long", 400);
  }
  return cleanName;
}

/** Accepts an array, a JSON array string or a comma-separated string (multipart forms). */
function parseMemberIds(rawMemberIds) {
  if (!rawMemberIds) return [];

  if (Array.isArray(rawMemberIds)) {
    return rawMemberIds.map((memberId) => String(memberId).trim()).filter(Boolean);
  }

  if (typeof rawMemberIds === "string") {
    const trimmed = rawMemberIds.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((memberId) => String(memberId).trim()).filter(Boolean);
      }
    } catch {
      // Fall back to comma-separated values for simple form clients.
    }

    return trimmed.split(",").map((memberId) => memberId.trim()).filter(Boolean);
  }

  return [];
}

/** Removes a user from the group and their per-user state (caller saves). */
function removeParticipant(conversation, userId) {
  const userKey = toIdString(userId);
  conversation.participantIds = conversation.participantIds
    .filter((participantId) => toIdString(participantId) !== userKey);
  conversation.unreadCounts.delete(userKey);
  conversation.hiddenBy.delete(userKey);
}

async function uploadAvatarUrl(file) {
  if (!file?.buffer) return null;
  const result = await uploadGroupAvatar(file.buffer);
  return result?.secure_url || null;
}

export async function createGroupConversation(currentUserId, { name = "", memberIds } = {}, file) {
  const cleanName = cleanGroupName(name);

  const uniqueMemberIds = [...new Set(parseMemberIds(memberIds))]
    .filter((memberId) => !isSameUser(memberId, currentUserId));

  for (const memberId of uniqueMemberIds) {
    assertObjectId(memberId, "Invalid member id");
    await ensureAcceptedFriendship(currentUserId, memberId);
  }

  const conversation = await Conversation.create({
    type: "group",
    name: cleanName,
    avatarUrl: (await uploadAvatarUrl(file)) || "",
    participantIds: [currentUserId, ...uniqueMemberIds],
    createdById: currentUserId,
  });

  return loadConversationResult(conversation._id, currentUserId);
}

export async function updateGroupConversation(currentUserId, conversationId, { name } = {}, file) {
  const conversation = await getGroupConversation(conversationId, currentUserId);
  assertGroupOwner(conversation, currentUserId);

  if (typeof name === "string") {
    conversation.name = cleanGroupName(name);
  }

  const avatarUrl = await uploadAvatarUrl(file);
  if (avatarUrl) {
    conversation.avatarUrl = avatarUrl;
  }

  await conversation.save();

  return loadConversationResult(conversationId, currentUserId);
}

export async function addGroupMember(currentUserId, conversationId, memberId) {
  assertObjectId(conversationId, "Invalid conversation id");
  assertObjectId(memberId, "Invalid member id");

  const conversation = await getGroupConversation(conversationId, currentUserId);
  await ensureAcceptedFriendship(currentUserId, memberId);

  if (conversation.participantIds.some((participantId) => isSameUser(participantId, memberId))) {
    throw new AppError("User is already a group member", 409);
  }

  const user = await User.findById(memberId).select("_id");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  conversation.participantIds.push(memberId);
  conversation.hiddenBy.delete(toIdString(memberId));
  await conversation.save();

  return loadConversationResult(conversationId, currentUserId);
}

export async function removeGroupMember(currentUserId, conversationId, memberId) {
  assertObjectId(conversationId, "Invalid conversation id");
  assertObjectId(memberId, "Invalid member id");

  const conversation = await getGroupConversation(conversationId, currentUserId);
  assertGroupOwner(conversation, currentUserId);

  if (isSameUser(memberId, currentUserId)) {
    throw new AppError("Use leave group instead", 400);
  }

  const initialCount = conversation.participantIds.length;
  removeParticipant(conversation, memberId);

  if (conversation.participantIds.length === initialCount) {
    throw new AppError("Member not found in group", 404);
  }

  await conversation.save();

  return {
    ...(await loadConversationResult(conversationId, currentUserId)),
    removedUserId: toIdString(memberId),
  };
}

export async function leaveGroupConversation(currentUserId, conversationId) {
  const conversation = await getGroupConversation(conversationId, currentUserId);

  if (isSameUser(conversation.createdById, currentUserId)) {
    throw new AppError("Group owner must delete the group or transfer ownership first", 400);
  }

  removeParticipant(conversation, currentUserId);
  await conversation.save();

  // The leaver is no longer a member, so the returned view is a remaining member's.
  const populatedConversation = await populateConversation(conversationId);
  const viewerId = populatedConversation.participantIds[0]?._id || currentUserId;

  return {
    ...buildConversationResult(populatedConversation, viewerId),
    removedUserId: toIdString(currentUserId),
    conversationId: toIdString(conversationId),
  };
}

export async function deleteGroupConversation(currentUserId, conversationId) {
  const conversation = await getGroupConversation(conversationId, currentUserId);
  assertGroupOwner(conversation, currentUserId);

  const participantIds = conversation.participantIds.map((participantId) => toIdString(participantId));
  await Message.deleteMany({ conversationId });
  await Conversation.deleteOne({ _id: conversationId });

  return {
    conversationId: toIdString(conversationId),
    participantIds,
  };
}
