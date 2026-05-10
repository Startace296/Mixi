import { Router } from "express";

import {
  addCommentHandler,
  addReplyHandler,
  createPostHandler,
  deleteCommentHandler,
  deletePostHandler,
  getPostsHandler,
  toggleCommentLikeHandler,
  togglePostLikeHandler,
  updateCommentHandler,
} from "../controllers/post.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { postImageUpload } from "../middlewares/upload.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(getPostsHandler));
router.post("/", requireAuth, postImageUpload.single("image"), asyncHandler(createPostHandler));
router.delete("/:postId", requireAuth, asyncHandler(deletePostHandler));
router.post("/:postId/likes", requireAuth, asyncHandler(togglePostLikeHandler));
router.post("/:postId/comments", requireAuth, asyncHandler(addCommentHandler));
router.post("/:postId/comments/:commentId/replies", requireAuth, asyncHandler(addReplyHandler));
router.patch("/:postId/comments/:commentId", requireAuth, asyncHandler(updateCommentHandler));
router.delete("/:postId/comments/:commentId", requireAuth, asyncHandler(deleteCommentHandler));
router.post("/:postId/comments/:commentId/likes", requireAuth, asyncHandler(toggleCommentLikeHandler));

export default router;
