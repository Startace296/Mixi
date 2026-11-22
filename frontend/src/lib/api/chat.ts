/** Conversations, groups, messages and the AI helpers. */
import { axiosInstance } from './client';
import type {
  ChatAiParams,
  ConversationIdResponse,
  ConversationResponse,
  ConversationsResponse,
  DeleteMessageResponse,
  Id,
  MessagesResponse,
  SendMessageResponse,
  SuggestRepliesResponse,
  SummarizeChatResponse,
} from '../../types';

export const getChatConversations = async ({ limit = 50 }: { limit?: number } = {}) => {
  const response = await axiosInstance.get<ConversationsResponse>('/chat/conversations', {
    params: {
      limit,
    },
  });
  return response.data;
};

export const createDirectConversation = async ({ friendId }: { friendId: Id }) => {
  const response = await axiosInstance.post<ConversationResponse>(`/chat/conversations/direct/${friendId}`);
  return response.data;
};

export const createGroupConversation = async ({ name, avatar }: { name: string; avatar?: File | null }) => {
  const formData = new FormData();
  formData.append('name', name);
  if (avatar) formData.append('avatar', avatar);

  const response = await axiosInstance.post<ConversationResponse>('/chat/conversations/group', formData);
  return response.data;
};

export const updateGroupConversation = async ({
  conversationId,
  name,
  avatar,
}: {
  conversationId: Id;
  name?: string;
  avatar?: File | null;
}) => {
  const formData = new FormData();
  if (typeof name === 'string') formData.append('name', name);
  if (avatar) formData.append('avatar', avatar);

  const response = await axiosInstance.patch<ConversationResponse>(
    `/chat/conversations/${conversationId}/group`,
    formData,
  );
  return response.data;
};

export const addGroupMember = async ({ conversationId, memberId }: { conversationId: Id; memberId: Id }) => {
  const response = await axiosInstance.post<ConversationResponse>(
    `/chat/conversations/${conversationId}/members`,
    { memberId },
  );
  return response.data;
};

export const removeGroupMember = async ({ conversationId, memberId }: { conversationId: Id; memberId: Id }) => {
  const response = await axiosInstance.delete<ConversationResponse>(
    `/chat/conversations/${conversationId}/members/${memberId}`,
  );
  return response.data;
};

export const leaveGroupConversation = async ({ conversationId }: { conversationId: Id }) => {
  const response = await axiosInstance.post<ConversationIdResponse>(`/chat/conversations/${conversationId}/leave`);
  return response.data;
};

export const deleteGroupConversation = async ({ conversationId }: { conversationId: Id }) => {
  const response = await axiosInstance.delete<ConversationIdResponse>(`/chat/conversations/${conversationId}`);
  return response.data;
};

export const getChatMessages = async ({
  conversationId,
  limit = 50,
  before,
  after,
  deletedSince,
  signal,
}: {
  conversationId: Id;
  limit?: number;
  /** Older page: messages strictly before this cursor. */
  before?: string | null;
  /** Catch-up page: messages strictly after this cursor. */
  after?: string | null;
  /** A previous `serverTime`: also return ids of messages deleted since then. */
  deletedSince?: string | null;
  signal?: AbortSignal;
}) => {
  const response = await axiosInstance.get<MessagesResponse>(`/chat/conversations/${conversationId}/messages`, {
    params: {
      limit,
      before: before || undefined,
      after: after || undefined,
      deletedSince: deletedSince || undefined,
    },
    signal,
  });
  return response.data;
};

/**
 * `clientMessageId` makes the send idempotent: retrying with the same key after a
 * failure that actually reached the server returns the stored message (HTTP 200)
 * instead of creating a second one.
 */
export const sendChatMessage = async ({
  conversationId,
  text,
  imageUrl,
  clientMessageId,
}: {
  conversationId: Id;
  text?: string;
  imageUrl?: string;
  clientMessageId?: string;
}) => {
  const response = await axiosInstance.post<SendMessageResponse>(`/chat/conversations/${conversationId}/messages`, {
    text,
    imageUrl,
    clientMessageId,
  });
  return response.data;
};

export const sendChatImage = async ({
  conversationId,
  file,
  clientMessageId,
}: {
  conversationId: Id;
  file: File;
  clientMessageId?: string;
}) => {
  const formData = new FormData();
  // Text fields first, so the server has the key before the file stream ends.
  if (clientMessageId) formData.append('clientMessageId', clientMessageId);
  formData.append('image', file);

  const response = await axiosInstance.post<SendMessageResponse>(
    `/chat/conversations/${conversationId}/images`,
    formData,
  );
  return response.data;
};

/** Marks read up to `upToMessageId` (the newest message actually on screen), or all. */
export const markChatConversationRead = async ({
  conversationId,
  upToMessageId,
}: {
  conversationId: Id;
  upToMessageId?: Id | null;
}) => {
  const response = await axiosInstance.patch<ConversationResponse>(
    `/chat/conversations/${conversationId}/read`,
    upToMessageId ? { upToMessageId } : {},
  );
  return response.data;
};

export const hideChatConversation = async ({ conversationId }: { conversationId: Id }) => {
  const response = await axiosInstance.patch<ConversationIdResponse>(`/chat/conversations/${conversationId}/hide`);
  return response.data;
};

export const deleteChatMessage = async ({ messageId }: { messageId: Id }) => {
  const response = await axiosInstance.delete<DeleteMessageResponse>(`/chat/messages/${messageId}`);
  return response.data;
};

export const summarizeChat = async ({ conversationId, endMessageId, startMessageId, maxMessages = 30 }: ChatAiParams) => {
  const response = await axiosInstance.post<SummarizeChatResponse>(
    `/chat/conversations/${conversationId}/ai/summarize`,
    { endMessageId, startMessageId, maxMessages },
  );
  return response.data;
};

export const suggestChatReplies = async ({
  conversationId,
  endMessageId,
  startMessageId,
  maxMessages = 30,
}: ChatAiParams) => {
  const response = await axiosInstance.post<SuggestRepliesResponse>(
    `/chat/conversations/${conversationId}/ai/suggest-replies`,
    { endMessageId, startMessageId, maxMessages },
  );
  return response.data;
};
