import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { getSearchScore } from "../utils/search.utils.js";
import { sanitizeUser } from "./user.service.js";

const DEFAULT_LIST_LIMIT = 20;
const USER_SELECT_FIELDS = "displayName avatarUrl provider lastLoginAt createdAt email";

function toIdString(value) {
  return String(value);
}

function normalizePairIds(leftId, rightId) {
  const left = toIdString(leftId);
  const right = toIdString(rightId);

  if (left === right) {
    throw new AppError("You cannot send a friend request to yourself", 400);
  }

  return left < right
    ? { pairLowId: left, pairHighId: right }
    : { pairLowId: right, pairHighId: left };
}

function parseLimit(rawLimit) {
  return Math.min(
    Math.max(Number.parseInt(rawLimit, 10) || DEFAULT_LIST_LIMIT, 1),
    50,
  );
}

function rankByDisplayName(items, query, limit, fallbackSort = "alphabetical") {
  const normalizedQuery = typeof query === "string" ? query.trim() : "";

  if (!normalizedQuery) {
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

  return items
    .map((item) => ({
      item,
      score: getSearchScore(item.displayName || "", normalizedQuery),
    }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => {
      if (left.score !== right.score) return left.score - right.score;
      return (left.item.displayName || "").localeCompare(right.item.displayName || "");
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

function buildFriendItem(relation, currentUserId) {
  const requesterId = relation.requestedById?._id ? toIdString(relation.requestedById._id) : toIdString(relation.requestedById);
  const currentId = toIdString(currentUserId);
  const otherUser = requesterId === currentId ? relation.receiverId : relation.requestedById;

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

function buildRequestItem(relation) {
  const requester = relation.requestedById;
  const user = sanitizeUser(requester);

  return {
    id: user.id,
    requestId: relation._id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    email: user.email,
    createdAt: relation.createdAt,
  };
}

async function loadAcceptedRelations(currentUserId) {
  return FriendRequest.find({
    status: "accepted",
    $or: [{ requestedById: currentUserId }, { receiverId: currentUserId }],
  })
    .populate("requestedById", USER_SELECT_FIELDS)
    .populate("receiverId", USER_SELECT_FIELDS);
}

async function loadIncomingPendingRelations(currentUserId) {
  return FriendRequest.find({
    status: "pending",
    receiverId: currentUserId,
  })
    .populate("requestedById", USER_SELECT_FIELDS)
    .populate("receiverId", USER_SELECT_FIELDS);
}

export async function listFriends(currentUserId, rawQuery, rawLimit = DEFAULT_LIST_LIMIT) {
  const limit = parseLimit(rawLimit);
  const relations = await loadAcceptedRelations(currentUserId);
  const items = relations
    .map((relation) => buildFriendItem(relation, currentUserId))
    .filter(Boolean);

  return rankByDisplayName(items, rawQuery, limit, "alphabetical");
}

export async function listIncomingFriendRequests(currentUserId, rawQuery, rawLimit = DEFAULT_LIST_LIMIT) {
  const limit = parseLimit(rawLimit);
  const relations = await loadIncomingPendingRelations(currentUserId);
  const items = relations
    .map((relation) => buildRequestItem(relation))
    .filter(Boolean);

  return rankByDisplayName(items, rawQuery, limit, "recent");
}

export async function createFriendRequest(currentUserId, receiverId) {
  const senderId = toIdString(currentUserId);
  const targetId = toIdString(receiverId);

  if (senderId === targetId) {
    throw new AppError("You cannot send a friend request to yourself", 400);
  }

  const receiver = await User.findById(targetId);
  if (!receiver || !receiver.isEmailVerified) {
    throw new AppError("User not found", 404);
  }

  const { pairLowId, pairHighId } = normalizePairIds(senderId, targetId);

  const existingRelation = await FriendRequest.findOne({ pairLowId, pairHighId });
  if (existingRelation) {
    if (existingRelation.status === "accepted") {
      throw new AppError("You are already friends with this user", 409);
    }
    if (toIdString(existingRelation.requestedById) === senderId) {
      throw new AppError("Friend request already sent", 409);
    }
    throw new AppError("This user already sent you a friend request", 409);
  }

  const relation = await FriendRequest.create({
    pairLowId,
    pairHighId,
    requestedById: senderId,
    receiverId: targetId,
    status: "pending",
  });

  return {
    id: relation._id,
    requestId: relation._id,
    requesterId: senderId,
    receiverId: targetId,
    status: relation.status,
    createdAt: relation.createdAt,
  };
}

export async function acceptFriendRequest(currentUserId, requestId) {
  const relation = await FriendRequest.findOne({
    _id: requestId,
    receiverId: currentUserId,
    status: "pending",
  });

  if (!relation) {
    throw new AppError("Friend request not found", 404);
  }

  relation.status = "accepted";
  relation.respondedAt = new Date();
  await relation.save();

  return {
    id: relation._id,
    requestId: relation._id,
    requesterId: toIdString(relation.requestedById),
    receiverId: toIdString(relation.receiverId),
    status: relation.status,
    respondedAt: relation.respondedAt,
  };
}

export async function declineFriendRequest(currentUserId, requestId) {
  const relation = await FriendRequest.findOneAndDelete({
    _id: requestId,
    receiverId: currentUserId,
    status: "pending",
  });

  if (!relation) {
    throw new AppError("Friend request not found", 404);
  }

  return {
    id: relation._id,
    requestId: relation._id,
    requesterId: toIdString(relation.requestedById),
    receiverId: toIdString(relation.receiverId),
    status: "declined",
  };
}

export async function cancelFriendRequest(currentUserId, requestId) {
  const relation = await FriendRequest.findOneAndDelete({
    _id: requestId,
    requestedById: currentUserId,
    status: "pending",
  });

  if (!relation) {
    throw new AppError("Friend request not found", 404);
  }

  return {
    id: relation._id,
    requestId: relation._id,
    requesterId: toIdString(relation.requestedById),
    receiverId: toIdString(relation.receiverId),
    status: "cancelled",
  };
}

export async function removeFriend(currentUserId, relationshipId) {
  const relation = await FriendRequest.findOneAndDelete({
    _id: relationshipId,
    status: "accepted",
    $or: [{ requestedById: currentUserId }, { receiverId: currentUserId }],
  });

  if (!relation) {
    throw new AppError("Friendship not found", 404);
  }

  return {
    id: relation._id,
    relationshipId: relation._id,
    requesterId: toIdString(relation.requestedById),
    receiverId: toIdString(relation.receiverId),
    status: "removed",
  };
}
