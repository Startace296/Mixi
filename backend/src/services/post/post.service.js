import Post from "../../models/Post.js";
import { uploadPostImage } from "../../lib/image-upload.js";
import { AppError } from "../../utils/app-error.js";
import { assertObjectId, toIdString } from "../../utils/id.utils.js";
import { parseDateCursor, parseLimit } from "../../utils/pagination.utils.js";
import { assertCanViewPost, assertIsAuthor, getVisiblePostAuthorIds } from "./post.access.js";
import { cleanCaption, toggleLikedBy } from "./post.helpers.js";
import { sanitizePost } from "./post.mapper.js";
import { findPopulatedPostById, populatePostAuthors } from "./post.queries.js";

const DEFAULT_POST_LIMIT = 20;
const MAX_POST_LIMIT = 50;

export async function listPosts(currentUserId, { limit: rawLimit, before, authorId } = {}) {
  const limit = parseLimit(rawLimit, DEFAULT_POST_LIMIT, MAX_POST_LIMIT);
  const visibleAuthorIds = await getVisiblePostAuthorIds(currentUserId);
  const requestedAuthorId = authorId ? toIdString(authorId) : null;

  if (requestedAuthorId) {
    assertObjectId(requestedAuthorId, "Invalid author id");
  }

  let authorFilter = { $in: visibleAuthorIds };
  if (requestedAuthorId) {
    // Asking for a non-friend's posts returns an empty feed rather than an error.
    authorFilter = visibleAuthorIds.includes(requestedAuthorId) ? requestedAuthorId : { $in: [] };
  }

  const query = { authorId: authorFilter };

  if (before) {
    query.createdAt = { $lt: parseDateCursor(before, "Invalid post cursor") };
  }

  const posts = await populatePostAuthors(
    Post.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1),
  );

  const hasMore = posts.length > limit;
  const visiblePosts = hasMore ? posts.slice(0, limit) : posts;

  return {
    posts: visiblePosts.map((post) => sanitizePost(post, currentUserId)),
    pageInfo: {
      hasMore,
      nextBefore: visiblePosts.at(-1)?.createdAt || null,
    },
  };
}

export async function createPost(currentUserId, { caption = "" } = {}, file) {
  const cleanedCaption = cleanCaption(caption);

  if (!cleanedCaption && !file?.buffer) {
    throw new AppError("Post text or image is required", 400);
  }

  let uploadResult = null;
  if (file?.buffer) {
    uploadResult = await uploadPostImage(file.buffer);
    if (!uploadResult?.secure_url) {
      throw new AppError("Failed to upload post image", 500);
    }
  }

  const post = await Post.create({
    authorId: currentUserId,
    caption: cleanedCaption,
    imageUrl: uploadResult?.secure_url || "",
    imagePublicId: uploadResult?.public_id || "",
  });
  const populatedPost = await findPopulatedPostById(post._id);

  return sanitizePost(populatedPost, currentUserId);
}

export async function togglePostLike(currentUserId, postId) {
  assertObjectId(postId, "Invalid post id");

  const post = await Post.findById(postId);
  await assertCanViewPost(currentUserId, post);

  const liked = toggleLikedBy(post, currentUserId);
  await post.save();

  return {
    liked,
    likeCount: post.likedBy.length,
  };
}

export async function updatePost(currentUserId, postId, { caption = "" } = {}) {
  assertObjectId(postId, "Invalid post id");
  const cleanedCaption = cleanCaption(caption);

  const post = await Post.findById(postId);
  if (!post) throw new AppError("Post not found", 404);
  assertIsAuthor(post, currentUserId, "You can only edit your own posts");

  if (!cleanedCaption && !post.imageUrl) {
    throw new AppError("Post text or image is required", 400);
  }

  post.caption = cleanedCaption;
  await post.save();

  const populatedPost = await findPopulatedPostById(post._id);
  return sanitizePost(populatedPost, currentUserId);
}

export async function deletePost(currentUserId, postId) {
  assertObjectId(postId, "Invalid post id");

  const post = await Post.findById(postId);
  if (!post) throw new AppError("Post not found", 404);
  assertIsAuthor(post, currentUserId, "You can only delete your own posts");

  await post.deleteOne();

  return {
    postId: toIdString(postId),
  };
}
