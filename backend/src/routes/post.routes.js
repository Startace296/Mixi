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
  updatePostHandler,
} from "../controllers/post.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { postImageUpload } from "../middlewares/upload.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { commentSchema, createPostSchema, replySchema, updatePostSchema } from "../validation/post.schemas.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(getPostsHandler));
router.post("/", requireAuth, postImageUpload.single("image"), validateBody(createPostSchema), asyncHandler(createPostHandler));
router.patch("/:postId", requireAuth, validateBody(updatePostSchema), asyncHandler(updatePostHandler));
router.delete("/:postId", requireAuth, asyncHandler(deletePostHandler));
router.post("/:postId/likes", requireAuth, asyncHandler(togglePostLikeHandler));
router.post("/:postId/comments", requireAuth, validateBody(commentSchema), asyncHandler(addCommentHandler));
router.post("/:postId/comments/:commentId/replies", requireAuth, validateBody(replySchema), asyncHandler(addReplyHandler));
router.patch("/:postId/comments/:commentId", requireAuth, validateBody(commentSchema), asyncHandler(updateCommentHandler));
router.delete("/:postId/comments/:commentId", requireAuth, asyncHandler(deleteCommentHandler));
router.post("/:postId/comments/:commentId/likes", requireAuth, asyncHandler(toggleCommentLikeHandler));

export default router;
