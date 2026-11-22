/** Types shared between components and hooks that describe UI state or callbacks, not API data. */
import type { ToggleCommentLikeResponse, TogglePostLikeResponse } from './api';
import type { Conversation } from './chat';
import type { Id } from './common';
import type { Post, PostComment, PostReply } from './post';
import type { ChatTarget, ProfileTarget } from './user';

// --- Navigation callbacks ---

export type OpenProfileHandler = (target: ProfileTarget) => void;
export type OpenChatHandler = (target: ChatTarget) => void;

/**
 * `shouldNavigate` (default true) also updates the URL; false only refreshes the selected thread.
 * Called with null when the selected conversation disappears and none is left.
 */
export type SelectChatHandler = (conversation: Conversation | null, shouldNavigate?: boolean) => void;

// --- Chat ---

/** A conversation held in UI state; `otherUserId` is an older alias of `friendId` that is still accepted. */
export type ChatThread = Conversation & { otherUserId?: Id | null };

/** A member passed from the group-management UI (users and friend rows both work). */
export interface GroupMemberRef {
  id?: Id;
  _id?: Id;
  displayName?: string;
}

/** First/last unread message ids, captured once when a thread is opened. */
export interface UnreadMarkers {
  firstId: Id | undefined;
  lastId: Id | undefined;
  count: number;
}

// --- Posts ---

/**
 * Post actions owned by the parent (feed or profile). Each one calls the API, updates the
 * parent's copy of the post, and returns what the card needs to update its own local state.
 */
export interface PostActionHandlers {
  onTogglePostLike?: (postId: Id) => Promise<Pick<TogglePostLikeResponse, 'liked' | 'likeCount'> | undefined>;
  onUpdatePost?: (postId: Id, caption: string) => Promise<Post | undefined>;
  onDeletePost?: (postId: Id) => Promise<void>;
  onAddComment?: (postId: Id, text: string) => Promise<PostComment | undefined>;
  onAddReply?: (postId: Id, commentId: Id, text: string) => Promise<PostReply | undefined>;
  onUpdateComment?: (postId: Id, commentId: Id, text: string) => Promise<void>;
  onDeleteComment?: (postId: Id, commentId: Id) => Promise<void>;
  onToggleCommentLike?: (
    postId: Id,
    commentId: Id,
  ) => Promise<Pick<ToggleCommentLikeResponse, 'liked' | 'likeCount'> | undefined>;
}
