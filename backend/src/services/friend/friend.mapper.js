import { sanitizeUser } from "../../mappers/user.mapper.js";
import { toIdString } from "../../utils/id.utils.js";

/** A row of the friends list (relation must have both users populated). */
export function buildFriendItem(relation, currentUserId) {
  const requesterId = toIdString(relation.requestedById);
  const otherUser = requesterId === toIdString(currentUserId) ? relation.receiverId : relation.requestedById;

  if (!otherUser) {
    return null;
  }

  const user = sanitizeUser(otherUser);

  return {
    id: user.id,
    friendId: user.id,
    relationshipId: relation._id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    email: user.email,
    createdAt: relation.respondedAt || relation.createdAt,
    since: relation.respondedAt || relation.createdAt,
  };
}

/** A row of the incoming friend requests list (requester must be populated). */
export function buildRequestItem(relation) {
  const user = sanitizeUser(relation.requestedById);

  return {
    id: user.id,
    requestId: relation._id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    email: user.email,
    createdAt: relation.createdAt,
  };
}

/** Response for a friend request action (accept/decline/cancel). */
export function buildRequestResult(relation, status) {
  return {
    id: relation._id,
    requestId: relation._id,
    requesterId: toIdString(relation.requestedById),
    receiverId: toIdString(relation.receiverId),
    status,
  };
}
