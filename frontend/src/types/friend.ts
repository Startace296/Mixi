import type { Id, ISODateString } from './common';

/** One row of GET /friends (buildFriendItem in friend.mapper.js). */
export interface Friend {
  id: Id;
  friendId: Id;
  relationshipId: Id;
  displayName: string;
  avatarUrl?: string;
  email: string;
  createdAt: ISODateString;
  since: ISODateString;
}

/** One row of GET /friends/requests (buildRequestItem). `id` is the requester's user id. */
export interface FriendRequestItem {
  id: Id;
  requestId: Id;
  displayName: string;
  avatarUrl?: string;
  email: string;
  createdAt: ISODateString;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

/** Result of creating / accepting / declining / cancelling a request (buildRequestResult). */
export interface FriendRequestResult {
  id: Id;
  requestId: Id;
  requesterId: Id;
  receiverId: Id;
  status: FriendRequestStatus;
  createdAt?: ISODateString;
  respondedAt?: ISODateString;
}

/** Result of DELETE /friends/:relationshipId. */
export interface FriendshipRemoval {
  id: Id;
  relationshipId: Id;
  requesterId: Id;
  receiverId: Id;
  status: 'removed';
}
