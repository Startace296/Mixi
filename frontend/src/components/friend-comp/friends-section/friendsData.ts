import { getFriendRequests, getFriends, searchUsers } from '../../../lib/api';
import { HOME_SUB_SECTION, type HomeSubSection } from '../../../lib/navigation';
import type { Friend, FriendRequestItem, Id, UserSearchResult } from '../../../types';

/** A search result; `relationshipId` is not sent by the API today but enables Unfriend when present. */
export type SearchResultRow = UserSearchResult & { relationshipId?: Id | null };

export interface SectionData {
  friends: Friend[];
  incomingRequests: FriendRequestItem[];
  searchResults: SearchResultRow[];
}

/** Loads the lists shown in a friends sub-section (all friends, or requests + search results). */
export async function fetchSectionData(activeSubSection: HomeSubSection | null | undefined, activeQuery: string): Promise<SectionData> {
  if (activeSubSection === HOME_SUB_SECTION.friends_all) {
    const response = await getFriends({ q: activeQuery || undefined, limit: 20 });

    return {
      friends: response.friends || [],
      incomingRequests: [],
      searchResults: [],
    };
  }

  const requestsPromise = getFriendRequests({ q: activeQuery || undefined, limit: 20 });
  const usersPromise = activeQuery
    ? searchUsers({ q: activeQuery, limit: 20 })
    : Promise.resolve({ users: [] });

  const [requestsResponse, usersResponse] = await Promise.all([requestsPromise, usersPromise]);

  return {
    friends: [],
    incomingRequests: requestsResponse.requests || [],
    searchResults: usersResponse.users || [],
  };
}
