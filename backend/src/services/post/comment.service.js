// Comments and one level of replies on a post, plus comment likes.
import Post from "../../models/Post.js";
import { AppError } from "../../utils/app-error.js";
import { assertObjectId, toIdString } from "../../utils/id.utils.js";
import { assertCanViewPost, assertIsAuthor } from "./post.access.js";
import { cleanCommentText, toggleLikedBy } from "./post.helpers.js";
import { sanitizeComment } from "./post.mapper.js";
import { findPopulatedPostById } from "./post.queries.js";

/** Finds a top-level comment or a reply by id. `parent` is set when it is a reply. */
function findCommentOrReply(post, commentId) {
  for (const comment of post.comments || []) {
    if (toIdString(comment) === toIdString(commentId)) {
      return { comment, parent: null };
    }
    const reply = (comment.replies || []).find((row) => toIdString(row) === toIdString(commentId));
    if (reply) return { comment: reply, parent: comment };
  }
  return { comment: null, parent: null };
}

/** Loads a post the viewer may see, plus the comment/reply `commentId` in it (404 if missing). */
async function loadVisibleComment(currentUserId, postId, commentId) {
  const post = await Post.findById(postId);
  await assertCanViewPost(currentUserId, post);

  const { comment, parent } = findCommentOrReply(post, commentId);
  if (!comment) throw new AppError("Comment not found", 404);

  return { post, comment, parent };
}

export async function addComment(currentUserId, postId, { text = "" } = {}) {
  assertObjectId(postId, "Invalid post id");
  const cleanText = cleanCommentText(text, "Comment");

  const post = await Post.findById(postId);
  await assertCanViewPost(currentUserId, post);

  post.comments.push({
    authorId: currentUserId,
    text: cleanText,
  });
  await post.save();

  const populatedPost = await findPopulatedPostById(postId);
  const comment = populatedPost.comments.at(-1);
  return sanitizeComment(comment, currentUserId);
}

export async function addReply(currentUserId, postId, parentCommentId, { text = "" } = {}) {
  assertObjectId(postId, "Invalid post id");
  assertObjectId(parentCommentId, "Invalid comment id");
  const cleanText = cleanCommentText(text, "Reply");

  const post = await Post.findById(postId);
  await assertCanViewPost(currentUserId, post);

  const parentComment = post.comments.id(parentCommentId);
  if (!parentComment) throw new AppError("Comment not found", 404);

  parentComment.replies.push({
    authorId: currentUserId,
    text: cleanText,
  });
  await post.save();

  const populatedPost = await findPopulatedPostById(postId);
  const populatedParent = populatedPost.comments.id(parentCommentId);
  const reply = populatedParent.replies.at(-1);
  return sanitizeComment({ ...reply.toObject(), authorId: reply.authorId, replies: [] }, currentUserId);
}

export async function updateComment(currentUserId, postId, commentId, { text = "" } = {}) {
  assertObjectId(postId, "Invalid post id");
  assertObjectId(commentId, "Invalid comment id");
  const cleanText = cleanCommentText(text, "Comment");

  const { post, comment } = await loadVisibleComment(currentUserId, postId, commentId);
  assertIsAuthor(comment, currentUserId, "You can only edit your own comments");

  comment.text = cleanText;
  await post.save();

  return {
    commentId: toIdString(commentId),
    text: cleanText,
  };
}

export async function deleteComment(currentUserId, postId, commentId) {
  assertObjectId(postId, "Invalid post id");
  assertObjectId(commentId, "Invalid comment id");

  const { post, comment, parent } = await loadVisibleComment(currentUserId, postId, commentId);
  assertIsAuthor(comment, currentUserId, "You can only delete your own comments");

  if (parent) {
    parent.replies.pull(commentId);
  } else {
    post.comments.pull(commentId);
  }
  await post.save();

  return {
    commentId: toIdString(commentId),
  };
}

export async function toggleCommentLike(currentUserId, postId, commentId) {
  assertObjectId(postId, "Invalid post id");
  assertObjectId(commentId, "Invalid comment id");

  const { post, comment } = await loadVisibleComment(currentUserId, postId, commentId);

  const liked = toggleLikedBy(comment, currentUserId);
  await post.save();

  return {
    commentId: toIdString(commentId),
    liked,
    likeCount: comment.likedBy.length,
  };
}
