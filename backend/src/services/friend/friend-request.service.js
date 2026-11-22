// Friend request lifecycle: send -> accept / decline / cancel, and unfriend.
import FriendRequest from "../../models/FriendRequest.js";
import User from "../../models/User.js";
import { AppError } from "../../utils/app-error.js";
import { toIdString } from "../../utils/id.utils.js";
import { buildRequestResult } from "./friend.mapper.js";
import { buildPairQuery } from "./friendship.queries.js";

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

  const { pairLowId, pairHighId } = buildPairQuery(senderId, targetId);

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
    ...buildRequestResult(relation, relation.status),
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
    ...buildRequestResult(relation, relation.status),
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

  return buildRequestResult(relation, "declined");
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

  return buildRequestResult(relation, "cancelled");
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
