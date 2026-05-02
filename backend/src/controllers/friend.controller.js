import {
  acceptFriendRequest,
  cancelFriendRequest,
  createFriendRequest,
  declineFriendRequest,
  listFriends,
  listIncomingFriendRequests,
  removeFriend,
} from "../services/friend.service.js";
import { emitToUser } from "../socket.js";

function emitFriendEvent(userId, eventName, payload) {
  emitToUser(userId, eventName, {
    ...payload,
    changedAt: new Date().toISOString(),
  });
}

/** GET /friends */
export async function getFriendsHandler(req, res) {
  const friends = await listFriends(req.user.id, req.query.q, req.query.limit);

  res.json({
    success: true,
    friends,
  });
}

/** GET /friends/requests */
export async function getFriendRequestsHandler(req, res) {
  const requests = await listIncomingFriendRequests(req.user.id, req.query.q, req.query.limit);

  res.json({
    success: true,
    requests,
  });
}

/** POST /friends/requests */
export async function createFriendRequestHandler(req, res) {
  const request = await createFriendRequest(req.user.id, req.body.receiverId);

  emitFriendEvent(request.receiverId, "friend:request_created", {
    requestId: String(request.requestId),
    requesterId: String(request.requesterId),
    receiverId: String(request.receiverId),
  });

  res.status(201).json({
    success: true,
    message: "Friend request sent successfully.",
    request,
  });
}

/** POST /friends/requests/:requestId/accept */
export async function acceptFriendRequestHandler(req, res) {
  const request = await acceptFriendRequest(req.user.id, req.params.requestId);

  emitFriendEvent(request.requesterId, "friend:request_accepted", {
    requestId: String(request.requestId),
    requesterId: String(request.requesterId),
    receiverId: String(request.receiverId),
  });

  res.json({
    success: true,
    message: "Friend request accepted successfully.",
    request,
  });
}

/** DELETE /friends/requests/:requestId */
export async function declineFriendRequestHandler(req, res) {
  const request = await declineFriendRequest(req.user.id, req.params.requestId);

  emitFriendEvent(request.requesterId, "friend:request_declined", {
    requestId: String(request.requestId),
    requesterId: String(request.requesterId),
    receiverId: String(request.receiverId),
  });

  res.json({
    success: true,
    message: "Friend request declined successfully.",
    request,
  });
}

/** DELETE /friends/requests/:requestId/cancel */
export async function cancelFriendRequestHandler(req, res) {
  const request = await cancelFriendRequest(req.user.id, req.params.requestId);

  emitFriendEvent(request.receiverId, "friend:request_cancelled", {
    requestId: String(request.requestId),
    requesterId: String(request.requesterId),
    receiverId: String(request.receiverId),
  });

  res.json({
    success: true,
    message: "Friend request cancelled successfully.",
    request,
  });
}

/** DELETE /friends/:relationshipId */
export async function removeFriendHandler(req, res) {
  const friendship = await removeFriend(req.user.id, req.params.relationshipId);
  const currentUserId = String(req.user.id);
  const otherUserId = currentUserId === String(friendship.requesterId)
    ? friendship.receiverId
    : friendship.requesterId;

  emitFriendEvent(otherUserId, "friend:removed", {
    relationshipId: String(friendship.relationshipId),
    requesterId: String(friendship.requesterId),
    receiverId: String(friendship.receiverId),
  });

  res.json({
    success: true,
    message: "Friend removed successfully.",
    friendship,
  });
}
