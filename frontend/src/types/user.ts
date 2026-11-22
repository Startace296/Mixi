import type { Id, ISODateString } from './common';

export type Gender = 'Male' | 'Female' | 'Other';
export type AuthProvider = 'local' | 'google';

/**
 * Shape returned by the backend's sanitizeUser() (backend/src/mappers/user.mapper.js).
 * Users loaded with PUBLIC_USER_FIELDS (chat members, search results) have no
 * isEmailVerified/gender/dateOfBirth, so those are optional.
 */
export interface User {
  id: Id;
  email: string;
  displayName: string;
  provider: AuthProvider;
  isEmailVerified?: boolean;
  avatarUrl?: string;
  bio: string;
  location: string;
  lastLoginAt?: ISODateString | null;
  createdAt?: ISODateString;
  gender?: Gender;
  dateOfBirth?: ISODateString;
}

/** The signed-in user (same shape as any other user). */
export type AuthUser = User;

/** Minimal info needed to open someone's profile page (passed to onOpenProfile callbacks). */
export interface ProfileTarget {
  id: Id;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Anyone a direct chat can be opened with (friend row, friend request, search result).
 * The other user's id is read from `id`, then `friendId`, then `userId`.
 */
export interface ChatTarget {
  id?: Id;
  friendId?: Id;
  userId?: Id;
}

/** How the viewer relates to another user. */
export type RelationshipStatus = 'self' | 'none' | 'friends' | 'requested' | 'incoming';

/** GET /users/:userId */
export interface UserProfile extends User {
  relationshipStatus: RelationshipStatus;
  friendRequestId: Id | null;
  relationshipId: Id | null;
}

/** One row of GET /users/search */
export interface UserSearchResult extends User {
  relationshipStatus: Exclude<RelationshipStatus, 'self'>;
  friendRequestId: Id | null;
}
