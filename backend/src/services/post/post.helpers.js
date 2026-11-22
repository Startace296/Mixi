import { AppError } from "../../utils/app-error.js";
import { toIdString } from "../../utils/id.utils.js";
import { toTrimmedString } from "../../utils/text.utils.js";

const MAX_CAPTION_LENGTH = 4000;
const MAX_COMMENT_LENGTH = 1000;

export function cleanCaption(caption) {
  const value = toTrimmedString(caption);
  if (value.length > MAX_CAPTION_LENGTH) {
    throw new AppError("Post caption must be at most 4000 characters long", 400);
  }
  return value;
}

/** Validates comment/reply text. `label` is "Comment" or "Reply" for the error messages. */
export function cleanCommentText(text, label = "Comment") {
  const value = toTrimmedString(text);
  if (!value) throw new AppError(`${label} text is required`, 400);
  if (value.length > MAX_COMMENT_LENGTH) {
    throw new AppError(`${label} must be at most 1000 characters long`, 400);
  }
  return value;
}

/** Likes or unlikes `target` (a post or comment with a likedBy array). Caller saves. */
export function toggleLikedBy(target, currentUserId) {
  const currentId = toIdString(currentUserId);
  const alreadyLiked = target.likedBy.some((id) => toIdString(id) === currentId);
  target.likedBy = alreadyLiked
    ? target.likedBy.filter((id) => toIdString(id) !== currentId)
    : [...target.likedBy, currentUserId];
  return !alreadyLiked;
}
