import FriendRequest from "../../models/FriendRequest.js";
import User from "../../models/User.js";
import { PUBLIC_USER_FIELDS, sanitizeUser } from "../../mappers/user.mapper.js";
import { parseLimit } from "../../utils/pagination.utils.js";
import { rankByName } from "../../utils/search.utils.js";
import { getRelationshipStatus } from "./user.helpers.js";

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;

/** Map of otherUserId -> { relationshipStatus, friendRequestId } for every relation of the user. */
async function loadRelationMap(currentId) {
  const relations = currentId
    ? await FriendRequest.find({
      $or: [{ requestedById: currentId }, { receiverId: currentId }],
    }).select("requestedById receiverId status")
    : [];

  const relationMap = new Map();
  for (const relation of relations) {
    const requesterId = String(relation.requestedById);
    const otherUserId = requesterId === currentId ? String(relation.receiverId) : requesterId;

    relationMap.set(otherUserId, {
      relationshipStatus: getRelationshipStatus(relation, currentId),
      friendRequestId: String(relation._id),
    });
  }
  return relationMap;
}

export async function searchUsers(currentUserId, rawQuery, rawLimit = DEFAULT_SEARCH_LIMIT) {
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const limit = parseLimit(rawLimit, DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT);

  if (!query) {
    return [];
  }

  const currentId = currentUserId ? String(currentUserId) : null;
  const relationMap = await loadRelationMap(currentId);

  const users = await User.find({
    _id: currentId ? { $ne: currentId } : { $exists: true },
    isEmailVerified: true,
    displayName: { $ne: "" },
  }).select(PUBLIC_USER_FIELDS);

  return rankByName(users, query)
    .slice(0, limit)
    .map((user) => {
      const relationInfo = relationMap.get(String(user._id));

      return {
        ...sanitizeUser(user),
        relationshipStatus: relationInfo?.relationshipStatus || "none",
        friendRequestId: relationInfo?.friendRequestId || null,
      };
    });
}
