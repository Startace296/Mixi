import {
  acceptFriendRequest,
  createFriendRequest,
  declineFriendRequest,
  listFriends,
  listIncomingFriendRequests,
} from "../services/friend.service.js";

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

  res.status(201).json({
    success: true,
    message: "Friend request sent successfully.",
    request,
  });
}

/** POST /friends/requests/:requestId/accept */
export async function acceptFriendRequestHandler(req, res) {
  const request = await acceptFriendRequest(req.user.id, req.params.requestId);

  res.json({
    success: true,
    message: "Friend request accepted successfully.",
    request,
  });
}

/** DELETE /friends/requests/:requestId */
export async function declineFriendRequestHandler(req, res) {
  const request = await declineFriendRequest(req.user.id, req.params.requestId);

  res.json({
    success: true,
    message: "Friend request declined successfully.",
    request,
  });
}
