/** Feed posts, likes and comments. */
import { axiosInstance } from './client';
import type {
  CommentResponse,
  DeleteCommentResponse,
  DeletePostResponse,
  Id,
  PostResponse,
  PostsResponse,
  ReplyResponse,
  ToggleCommentLikeResponse,
  TogglePostLikeResponse,
  UpdateCommentResponse,
} from '../../types';

export const getPosts = async ({
  limit = 20,
  before,
  authorId,
}: {
  limit?: number;
  before?: string | null;
  authorId?: Id;
} = {}) => {
  const response = await axiosInstance.get<PostsResponse>('/posts', {
    params: {
      limit,
      before,
      authorId,
    },
  });
  return response.data;
};

export const createPost = async ({ caption, image }: { caption?: string; image?: File | null } = {}) => {
  const formData = new FormData();
  if (caption) formData.append('caption', caption);
  if (image) formData.append('image', image);

  const response = await axiosInstance.post<PostResponse>('/posts', formData);
  return response.data;
};

export const togglePostLike = async ({ postId }: { postId: Id }) => {
  const response = await axiosInstance.post<TogglePostLikeResponse>(`/posts/${postId}/likes`);
  return response.data;
};

export const updatePost = async ({ postId, caption }: { postId: Id; caption: string }) => {
  const response = await axiosInstance.patch<PostResponse>(`/posts/${postId}`, { caption });
  return response.data;
};

export const deletePost = async ({ postId }: { postId: Id }) => {
  const response = await axiosInstance.delete<DeletePostResponse>(`/posts/${postId}`);
  return response.data;
};

export const addPostComment = async ({ postId, text }: { postId: Id; text: string }) => {
  const response = await axiosInstance.post<CommentResponse>(`/posts/${postId}/comments`, { text });
  return response.data;
};

export const addPostReply = async ({ postId, commentId, text }: { postId: Id; commentId: Id; text: string }) => {
  const response = await axiosInstance.post<ReplyResponse>(
    `/posts/${postId}/comments/${commentId}/replies`,
    { text },
  );
  return response.data;
};

export const updatePostComment = async ({ postId, commentId, text }: { postId: Id; commentId: Id; text: string }) => {
  const response = await axiosInstance.patch<UpdateCommentResponse>(
    `/posts/${postId}/comments/${commentId}`,
    { text },
  );
  return response.data;
};

export const deletePostComment = async ({ postId, commentId }: { postId: Id; commentId: Id }) => {
  const response = await axiosInstance.delete<DeleteCommentResponse>(`/posts/${postId}/comments/${commentId}`);
  return response.data;
};

export const togglePostCommentLike = async ({ postId, commentId }: { postId: Id; commentId: Id }) => {
  const response = await axiosInstance.post<ToggleCommentLikeResponse>(
    `/posts/${postId}/comments/${commentId}/likes`,
  );
  return response.data;
};
