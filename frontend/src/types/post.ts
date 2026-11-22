import type { Id, ISODateString } from './common';

/** Fields shared by a comment and a reply (sanitizeCommentBody in post.mapper.js). */
export interface PostCommentBase {
  id: Id;
  authorId: Id;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  isOwn: boolean;
  likeCount: number;
  likedByViewer: boolean;
}

export type PostReply = PostCommentBase;

export interface PostComment extends PostCommentBase {
  replies: PostReply[];
}

/** sanitizePost(). `_id` and `id` are the same value. */
export interface Post {
  _id: Id;
  id: Id;
  authorId: Id;
  authorName: string;
  authorAvatar: string;
  caption: string;
  imageUrl: string;
  likeCount: number;
  likedByViewer: boolean;
  isOwn: boolean;
  comments: PostComment[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
