import Post from "../../models/Post.js";

const POST_USER_FIELDS = "displayName avatarUrl email";

/** Populates the post author and every comment/reply author on a Post query. */
export function populatePostAuthors(query) {
  return query
    .populate("authorId", POST_USER_FIELDS)
    .populate("comments.authorId", POST_USER_FIELDS)
    .populate("comments.replies.authorId", POST_USER_FIELDS);
}

export function findPopulatedPostById(postId) {
  return populatePostAuthors(Post.findById(postId));
}
