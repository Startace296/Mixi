import { z } from "zod";

import { objectIdSchema } from "./common.schemas.js";

const MAX_GROUP_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_AI_BATCH_MESSAGES = 50;

const groupNameSchema = z
  .string({ required_error: "Group name is required", invalid_type_error: "Group name must be a string" })
  .trim()
  .min(1, "Group name is required")
  .max(MAX_GROUP_NAME_LENGTH, `Group name must be at most ${MAX_GROUP_NAME_LENGTH} characters long`);

/**
 * Group routes are multipart (avatar upload), so memberIds may arrive as an array,
 * a JSON array string or a comma-separated string. The service parses and checks each id.
 */
const memberIdsSchema = z.union([z.array(z.string()), z.string()]).optional();

export const createGroupSchema = z.object({
  name: groupNameSchema,
  memberIds: memberIdsSchema,
});

export const updateGroupSchema = z.object({
  name: groupNameSchema.optional(),
});

export const addGroupMemberSchema = z.object({
  memberId: objectIdSchema("Invalid member id"),
});

export const sendMessageSchema = z
  .object({
    text: z
      .string({ invalid_type_error: "Message text must be a string" })
      .trim()
      .max(MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH} characters long`)
      .default(""),
    imageUrl: z
      .string({ invalid_type_error: "Image URL must be a string" })
      .trim()
      .refine((value) => !value || /^https?:\/\//i.test(value), "Image URL is invalid")
      .default(""),
    clientMessageId: z
      .string({ invalid_type_error: "clientMessageId must be a string" })
      .regex(/^[A-Za-z0-9_-]{8,64}$/, "Invalid clientMessageId")
      .optional(),
  })
  .refine((body) => body.text || body.imageUrl, {
    message: "Message text or image is required",
    path: ["text"],
  });

/** Body of PATCH /read: read up to this message (default: the latest one). */
export const markReadSchema = z.object({
  upToMessageId: objectIdSchema("Invalid upToMessageId").optional(),
});

/** Body of /ai/summarize and /ai/suggest-replies. */
export const aiMessageBatchSchema = z.object({
  endMessageId: objectIdSchema("endMessageId is required and must be a valid id"),
  startMessageId: objectIdSchema("Invalid startMessageId").optional(),
  maxMessages: z.coerce
    .number({ invalid_type_error: "maxMessages must be a number" })
    .int("maxMessages must be a whole number")
    .min(1, "maxMessages must be at least 1")
    .max(MAX_AI_BATCH_MESSAGES, `maxMessages must be at most ${MAX_AI_BATCH_MESSAGES}`)
    .optional(),
});
