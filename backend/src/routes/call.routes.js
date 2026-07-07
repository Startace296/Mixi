import { Router } from "express";

import { getTurnCredentialsHandler } from "../controllers/call.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get("/turn-credentials", requireAuth, asyncHandler(getTurnCredentialsHandler));

export default router;
