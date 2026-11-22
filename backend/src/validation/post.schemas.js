import { z } from "zod";

const MAX_CAPTION_LENGTH = 4000;
const MAX_COMMENT_LENGTH = 1000;

const captionSchema = z
  .string({ invalid_type_error: "Post caption must be a string" })
  .trim()
  .max(MAX_CAPTION_LENGTH, `Post caption must be at most ${MAX_CAPTION_LENGTH} characters long`)
  .default("");

/** `label` is "Comment" or "Reply" for the error messages. */
function commentTextSchema(label) {
  return z
    .string({ required_error: `${label} text is required`, invalid_type_error: `${label} text must be a string` })
    .trim()
    .min(1, `${label} text is required`)
    .max(MAX_COMMENT_LENGTH, `${label} must be at most ${MAX_COMMENT_LENGTH} characters long`);
}

/** Multipart body: "text or image is required" is checked in the service, which sees the file. */
export const createPostSchema = z.object({
  caption: captionSchema,
});

export const updatePostSchema = z.object({
  caption: captionSchema,
});

export const commentSchema = z.object({
  text: commentTextSchema("Comment"),
});

export const replySchema = z.object({
  text: commentTextSchema("Reply"),
});
