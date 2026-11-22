import { toIdString } from "../../utils/id.utils.js";

function buildAuthor(user) {
  return {
    id: toIdString(user),
    displayName: user?.displayName || user?.email?.split?.("@")?.[0] || "User",
    avatarUrl: user?.avatarUrl || "",
  };
}

/** Fields shared by a top-level comment and a reply. */
function sanitizeCommentBody(comment, currentId) {
  const author = buildAuthor(comment.authorId);
  const likedBy = comment.likedBy || [];

  return {
    id: toIdString(comment),
    authorId: author.id,
    authorName: author.displayName,
    authorAvatar: author.avatarUrl,
    text: comment.text,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isOwn: author.id === currentId,
    likeCount: likedBy.length,
    likedByViewer: likedBy.some((id) => toIdString(id) === currentId),
  };
}

export function sanitizeComment(comment, currentUserId) {
  const currentId = toIdString(currentUserId);

  return {
    ...sanitizeCommentBody(comment, currentId),
    replies: (comment.replies || []).map((reply) => sanitizeCommentBody(reply, currentId)),
  };
}

export function sanitizePost(post, currentUserId) {
  const author = buildAuthor(post.authorId);
  const currentId = toIdString(currentUserId);
  const likedBy = post.likedBy || [];

  return {
    _id: toIdString(post),
    id: toIdString(post),
    authorId: author.id,
    authorName: author.displayName,
    authorAvatar: author.avatarUrl,
    caption: post.caption || "",
    imageUrl: post.imageUrl || "",
    likeCount: likedBy.length,
    likedByViewer: likedBy.some((id) => toIdString(id) === currentId),
    isOwn: author.id === currentId,
    comments: (post.comments || []).map((comment) => sanitizeComment(comment, currentUserId)),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}
