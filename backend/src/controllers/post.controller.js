import {
  addComment,
  addReply,
  createPost,
  deleteComment,
  deletePost,
  listPosts,
  toggleCommentLike,
  togglePostLike,
  updateComment,
  updatePost,
} from "../services/post.service.js";

export async function getPostsHandler(req, res) {
  const result = await listPosts(req.user.id, req.query);

  res.json({
    success: true,
    ...result,
  });
}

export async function createPostHandler(req, res) {
  const post = await createPost(req.user.id, req.body, req.file);

  res.status(201).json({
    success: true,
    post,
  });
}

export async function togglePostLikeHandler(req, res) {
  const result = await togglePostLike(req.user.id, req.params.postId);

  res.json({
    success: true,
    ...result,
  });
}

export async function updatePostHandler(req, res) {
  const post = await updatePost(req.user.id, req.params.postId, req.body);

  res.json({
    success: true,
    post,
  });
}

export async function deletePostHandler(req, res) {
  const result = await deletePost(req.user.id, req.params.postId);

  res.json({
    success: true,
    ...result,
  });
}

export async function addCommentHandler(req, res) {
  const comment = await addComment(req.user.id, req.params.postId, req.body);

  res.status(201).json({
    success: true,
    comment,
  });
}

export async function addReplyHandler(req, res) {
  const reply = await addReply(req.user.id, req.params.postId, req.params.commentId, req.body);

  res.status(201).json({
    success: true,
    reply,
  });
}

export async function updateCommentHandler(req, res) {
  const result = await updateComment(req.user.id, req.params.postId, req.params.commentId, req.body);

  res.json({
    success: true,
    ...result,
  });
}

export async function deleteCommentHandler(req, res) {
  const result = await deleteComment(req.user.id, req.params.postId, req.params.commentId);

  res.json({
    success: true,
    ...result,
  });
}

export async function toggleCommentLikeHandler(req, res) {
  const result = await toggleCommentLike(req.user.id, req.params.postId, req.params.commentId);

  res.json({
    success: true,
    ...result,
  });
}
