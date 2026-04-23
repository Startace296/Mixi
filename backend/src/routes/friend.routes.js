import { Router } from "express";

import {
  acceptFriendRequestHandler,
  createFriendRequestHandler,
  declineFriendRequestHandler,
  getFriendRequestsHandler,
  getFriendsHandler,
} from "../controllers/friend.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(getFriendsHandler));
router.post("/requests", requireAuth, asyncHandler(createFriendRequestHandler));
router.get("/requests", requireAuth, asyncHandler(getFriendRequestsHandler));
router.post("/requests/:requestId/accept", requireAuth, asyncHandler(acceptFriendRequestHandler));
router.delete("/requests/:requestId", requireAuth, asyncHandler(declineFriendRequestHandler));

export default router;
