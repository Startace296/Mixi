// Who may see / modify a post: the author and their accepted friends.
import { AppError } from "../../utils/app-error.js";
import { toIdString } from "../../utils/id.utils.js";
import {
  findAcceptedRelationBetween,
  findAcceptedRelations,
  getOtherUserId,
} from "../friend/friendship.queries.js";

/** The ids whose posts appear in the user's feed: themselves plus every friend. */
export async function getVisiblePostAuthorIds(currentUserId) {
  const relations = await findAcceptedRelations(currentUserId).select("requestedById receiverId");

  const authorIds = new Set([toIdString(currentUserId)]);
  relations.forEach((relation) => authorIds.add(getOtherUserId(relation, currentUserId)));

  return [...authorIds];
}

/** Throws 404 unless the post exists and the viewer is its author or a friend of the author. */
export async function assertCanViewPost(currentUserId, post) {
  const currentId = toIdString(currentUserId);
  const authorId = toIdString(post?.authorId);

  if (!post) throw new AppError("Post not found", 404);
  if (authorId === currentId) return;

  const relation = await findAcceptedRelationBetween(currentId, authorId).select("_id");

  if (!relation) {
    throw new AppError("Post not found", 404);
  }
}

/** Throws 403 with `message` unless `item` (post or comment) was written by the user. */
export function assertIsAuthor(item, currentUserId, message) {
  if (toIdString(item.authorId) !== toIdString(currentUserId)) {
    throw new AppError(message, 403);
  }
}
