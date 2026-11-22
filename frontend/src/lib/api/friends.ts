/** Friend list, friend requests and unfriending. */
import { axiosInstance } from './client';
import type {
  FriendRequestActionResponse,
  FriendRequestsResponse,
  FriendsResponse,
  Id,
  RemoveFriendResponse,
  SearchParams,
} from '../../types';

export const getFriends = async ({ q, limit = 20 }: SearchParams = {}) => {
  const response = await axiosInstance.get<FriendsResponse>('/friends', {
    params: {
      q,
      limit,
    },
  });
  return response.data;
};

export const getFriendRequests = async ({ q, limit = 20 }: SearchParams = {}) => {
  const response = await axiosInstance.get<FriendRequestsResponse>('/friends/requests', {
    params: {
      q,
      limit,
    },
  });
  return response.data;
};

export const createFriendRequest = async ({ receiverId }: { receiverId: Id }) => {
  const response = await axiosInstance.post<FriendRequestActionResponse>('/friends/requests', { receiverId });
  return response.data;
};

export const cancelFriendRequest = async ({ requestId }: { requestId: Id }) => {
  const response = await axiosInstance.delete<FriendRequestActionResponse>(`/friends/requests/${requestId}/cancel`);
  return response.data;
};

export const acceptFriendRequest = async ({ requestId }: { requestId: Id }) => {
  const response = await axiosInstance.post<FriendRequestActionResponse>(`/friends/requests/${requestId}/accept`);
  return response.data;
};

export const declineFriendRequest = async ({ requestId }: { requestId: Id }) => {
  const response = await axiosInstance.delete<FriendRequestActionResponse>(`/friends/requests/${requestId}`);
  return response.data;
};

export const removeFriend = async ({ relationshipId }: { relationshipId: Id }) => {
  const response = await axiosInstance.delete<RemoveFriendResponse>(`/friends/${relationshipId}`);
  return response.data;
};
