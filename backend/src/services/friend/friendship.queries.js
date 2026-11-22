// Friendship lookups shared by the friend, chat and post services.
import FriendRequest from "../../models/FriendRequest.js";
import { toIdString } from "../../utils/id.utils.js";

/** FriendRequest stores each pair once as (pairLowId, pairHighId), sorted as strings. */
export function buildPairQuery(leftId, rightId) {
  const left = toIdString(leftId);
  const right = toIdString(rightId);

  return left < right
    ? { pairLowId: left, pairHighId: right }
    : { pairLowId: right, pairHighId: left };
}

/** Query for all accepted friendships of a user (chain .select / .populate as needed). */
export function findAcceptedRelations(userId) {
  return FriendRequest.find({
    status: "accepted",
    $or: [{ requestedById: userId }, { receiverId: userId }],
  });
}

/** Query for the accepted friendship between two users, if any. */
export function findAcceptedRelationBetween(leftId, rightId) {
  return FriendRequest.findOne({
    ...buildPairQuery(leftId, rightId),
    status: "accepted",
  });
}

/** The id of the user on the other side of `relation`, as seen by `userId`. */
export function getOtherUserId(relation, userId) {
  const requesterId = toIdString(relation.requestedById);
  const receiverId = toIdString(relation.receiverId);
  return requesterId === toIdString(userId) ? receiverId : requesterId;
}
