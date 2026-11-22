import FriendRequest from "../../models/FriendRequest.js";
import { PUBLIC_USER_FIELDS } from "../../mappers/user.mapper.js";
import { parseLimit } from "../../utils/pagination.utils.js";
import { rankByName } from "../../utils/search.utils.js";
import { buildFriendItem, buildRequestItem } from "./friend.mapper.js";
import { findAcceptedRelations } from "./friendship.queries.js";

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;

/** With a query: best name match first. Without one: alphabetical or most recent first. */
function rankByDisplayName(items, query, limit, fallbackSort = "alphabetical") {
  const normalizedQuery = typeof query === "string" ? query.trim() : "";

  if (normalizedQuery) {
    return rankByName(items, normalizedQuery).slice(0, limit);
  }

  return items
    .slice()
    .sort((left, right) => {
      if (fallbackSort === "recent") {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      }

      const leftName = left.displayName || "";
      const rightName = right.displayName || "";
      return leftName.localeCompare(rightName);
    })
    .slice(0, limit);
}

export async function listFriends(currentUserId, rawQuery, rawLimit = DEFAULT_LIST_LIMIT) {
  const limit = parseLimit(rawLimit, DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT);
  const relations = await findAcceptedRelations(currentUserId)
    .populate("requestedById", PUBLIC_USER_FIELDS)
    .populate("receiverId", PUBLIC_USER_FIELDS);
  const items = relations
    .map((relation) => buildFriendItem(relation, currentUserId))
    .filter(Boolean);

  return rankByDisplayName(items, rawQuery, limit, "alphabetical");
}

export async function listIncomingFriendRequests(currentUserId, rawQuery, rawLimit = DEFAULT_LIST_LIMIT) {
  const limit = parseLimit(rawLimit, DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT);
  const relations = await FriendRequest.find({
    status: "pending",
    receiverId: currentUserId,
  })
    .populate("requestedById", PUBLIC_USER_FIELDS)
    .populate("receiverId", PUBLIC_USER_FIELDS);
  const items = relations
    .map((relation) => buildRequestItem(relation))
    .filter(Boolean);

  return rankByDisplayName(items, rawQuery, limit, "recent");
}
