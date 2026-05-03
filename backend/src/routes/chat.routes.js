import { Router } from "express";

import {
  createDirectConversationHandler,
  deleteMessageHandler,
  getConversationsHandler,
  getMessagesHandler,
  hideConversationHandler,
  markConversationReadHandler,
  sendImageMessageHandler,
  sendMessageHandler,
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { chatImageUpload } from "../middlewares/upload.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get("/conversations", requireAuth, asyncHandler(getConversationsHandler));
router.post("/conversations/direct/:friendId", requireAuth, asyncHandler(createDirectConversationHandler));
router.get("/conversations/:conversationId/messages", requireAuth, asyncHandler(getMessagesHandler));
router.post("/conversations/:conversationId/messages", requireAuth, asyncHandler(sendMessageHandler));
router.post(
  "/conversations/:conversationId/images",
  requireAuth,
  chatImageUpload.single("image"),
  asyncHandler(sendImageMessageHandler),
);
router.patch("/conversations/:conversationId/read", requireAuth, asyncHandler(markConversationReadHandler));
router.patch("/conversations/:conversationId/hide", requireAuth, asyncHandler(hideConversationHandler));
router.delete("/messages/:messageId", requireAuth, asyncHandler(deleteMessageHandler));

export default router;
