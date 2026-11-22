/** Request params and response bodies for every function in lib/api.ts. */
import type { ApiSuccess, Id, ISODateString, PageInfo } from './common';
import type { ChatAiMeta, Conversation, Message } from './chat';
import type { Friend, FriendRequestItem, FriendRequestResult, FriendshipRemoval } from './friend';
import type { Post, PostComment, PostReply } from './post';
import type { Gender, User, UserProfile, UserSearchResult } from './user';

// --- Shared params ---

export interface SearchParams {
  q?: string;
  limit?: number;
}

/** Day/month/year come from <select> values and may be omitted. */
export interface BirthDateFields {
  day?: string | number;
  month?: string | number;
  year?: string | number;
}

// --- Auth ---

export interface AuthSuccessResponse extends ApiSuccess {
  token: string;
  user: User;
}

/** Anything that can be handed to useAuthStore.applyAuthSuccess(). */
export interface AuthSuccessPayload {
  token?: string | null;
  user?: User | null;
}

export interface RequestSignupOtpResponse extends ApiSuccess {
  user: User;
  otpExpiresAt: ISODateString;
  emailDelivered: boolean;
}

export interface VerifyOtpResponse extends ApiSuccess {
  user: User;
  registrationToken: string;
  registrationTokenExpiresAt: ISODateString;
}

export interface CompleteRegistrationParams extends BirthDateFields {
  email: string;
  registrationToken: string;
  password: string;
  displayName: string;
  gender: Gender | '';
}

export interface CompleteGoogleRegistrationParams extends BirthDateFields {
  googleSignupToken: string;
  displayName: string;
  gender: Gender | '';
}

/** POST /auth/google: either signs in, or asks the client to finish sign-up. */
export type GoogleLoginResponse =
  | (AuthSuccessResponse & { isNewUser?: false })
  | (ApiSuccess & {
      isNewUser: true;
      email: string;
      displayName: string;
      avatarUrl: string;
      googleSignupToken: string;
    });

// --- Users ---

export interface UserResponse extends ApiSuccess {
  user: User;
}

export interface UserProfileResponse extends ApiSuccess {
  user: UserProfile;
}

export interface UpdateProfileParams {
  displayName: string;
  /** The form can submit '' before a gender is picked; the server answers 400 in that case. */
  gender: Gender | '';
  dateOfBirth: string;
  bio?: string;
  location?: string;
}

export interface SearchUsersResponse extends ApiSuccess {
  users: UserSearchResult[];
}

// --- Friends ---

export interface FriendsResponse extends ApiSuccess {
  friends: Friend[];
}

export interface FriendRequestsResponse extends ApiSuccess {
  requests: FriendRequestItem[];
}

export interface FriendRequestActionResponse extends ApiSuccess {
  request: FriendRequestResult;
}

export interface RemoveFriendResponse extends ApiSuccess {
  friendship: FriendshipRemoval;
}

// --- Chat ---

export interface ConversationsResponse extends ApiSuccess {
  conversations: Conversation[];
}

export interface ConversationResponse extends ApiSuccess {
  conversation: Conversation;
}

export interface ConversationIdResponse extends ApiSuccess {
  conversationId: Id;
}

/** Keyset page of a conversation timeline. Messages always come oldest -> newest. */
export interface MessagePageInfo extends PageInfo {
  hasOlder: boolean;
  hasNewer: boolean;
  /** Cursor of the oldest message in the page; pass as `before` for the previous page. */
  startCursor: string | null;
  /** Cursor of the newest message in the page; pass as `after` to catch up. */
  endCursor: string | null;
}

export interface MessagesResponse extends ApiSuccess {
  messages: Message[];
  pageInfo: MessagePageInfo;
  /** Server clock when the page was read; send it back as `deletedSince` next sync. */
  serverTime?: ISODateString;
  /** Only when `deletedSince` was sent: messages deleted since then. */
  deletedMessageIds?: Id[];
  /** More deletions than one response reports: reload the newest page instead. */
  deletedTruncated?: boolean;
}

/** `message` here is the Message object, not a status string. */
export interface SendMessageResponse extends Omit<ApiSuccess, 'message'> {
  message: Message;
  conversation: Conversation;
}

/** `message` here is the deleted Message, not a status string. */
export interface DeleteMessageResponse extends Omit<ApiSuccess, 'message'> {
  message: Message;
}

export interface ChatAiParams {
  conversationId: Id;
  endMessageId?: Id;
  startMessageId?: Id;
  maxMessages?: number;
}

export interface SummarizeChatResponse extends ApiSuccess {
  summaryBullets: string[];
  meta: ChatAiMeta;
}

export interface SuggestRepliesResponse extends ApiSuccess {
  replies: string[];
  meta: ChatAiMeta;
}

// --- Posts ---

export interface PostsResponse extends ApiSuccess {
  posts: Post[];
  pageInfo: PageInfo;
}

export interface PostResponse extends ApiSuccess {
  post: Post;
}

export interface TogglePostLikeResponse extends ApiSuccess {
  liked: boolean;
  likeCount: number;
}

export interface DeletePostResponse extends ApiSuccess {
  postId: Id;
}

export interface CommentResponse extends ApiSuccess {
  comment: PostComment;
}

export interface ReplyResponse extends ApiSuccess {
  reply: PostReply;
}

export interface UpdateCommentResponse extends ApiSuccess {
  commentId: Id;
  text: string;
}

export interface DeleteCommentResponse extends ApiSuccess {
  commentId: Id;
}

export interface ToggleCommentLikeResponse extends ApiSuccess {
  commentId: Id;
  liked: boolean;
  likeCount: number;
}

// --- Calls ---

/** GET /calls/turn-credentials */
export interface TurnCredentialsResponse {
  iceServers: RTCIceServer[];
}
