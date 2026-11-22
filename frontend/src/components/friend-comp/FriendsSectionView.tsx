import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
  acceptFriendRequest,
  cancelFriendRequest,
  createFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../../lib/api';
import { HOME_SUB_SECTION, type HomeSubSection } from '../../lib/navigation';
import { FRIEND_SOCKET_EVENTS, getAuthenticatedSocket } from '../../lib/socket';
import { getErrorMessage } from '../../lib/errors';
import { FriendCard, FriendRequestCard, SectionDivider, UserSearchCard } from './friends-section/FriendCards';
import { fetchSectionData, type SearchResultRow, type SectionData } from './friends-section/friendsData';
import type {
  Friend,
  FriendRequestItem,
  Id,
  OpenChatHandler as OpenChat,
  OpenProfileHandler as OpenProfile,
} from '../../types';

interface FriendsSectionViewProps {
  subSection: HomeSubSection | null | undefined;
  onOpenChatWithFriend: OpenChat;
  onOpenProfile?: OpenProfile;
}

export default function FriendsSectionView({ subSection, onOpenChatWithFriend, onOpenProfile }: FriendsSectionViewProps) {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultRow[]>([]);
  const [busyActionId, setBusyActionId] = useState<Id | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const query = debouncedSearchText.trim();

  function applySectionData(data: SectionData) {
    setFriends(data.friends || []);
    setIncomingRequests(data.incomingRequests || []);
    setSearchResults(data.searchResults || []);
  }

  useEffect(() => {
    setSearchText('');
    setDebouncedSearchText('');
    setFriends([]);
    setIncomingRequests([]);
    setSearchResults([]);
    setBusyActionId(null);
    setLoading(false);
    setError('');
  }, [subSection]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchText]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const data = await fetchSectionData(subSection, query);
        if (cancelled) return;
        applySectionData(data);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load friends'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [query, subSection]);

  useEffect(() => {
    let cancelled = false;

    async function refreshSilently() {
      try {
        const data = await fetchSectionData(subSection, query);
        if (!cancelled) {
          applySectionData(data);
        }
      } catch {
        // Keep the current list visible; the next normal load can surface errors.
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSilently();
      }
    };

    const handleWindowFocus = () => {
      refreshSilently();
    };

    const socket = getAuthenticatedSocket();
    const handleFriendEvent = () => {
      refreshSilently();
    };

    if (socket) {
      FRIEND_SOCKET_EVENTS.forEach((eventName) => {
        socket.on(eventName, handleFriendEvent);
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      cancelled = true;
      if (socket) {
        FRIEND_SOCKET_EVENTS.forEach((eventName) => {
          socket.off(eventName, handleFriendEvent);
        });
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [query, subSection]);

  const refreshCurrentSection = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
    setError('');

    try {
      const data = await fetchSectionData(subSection, query);
      applySectionData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load friends'));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleAddFriend = async (user: SearchResultRow) => {
    try {
      setBusyActionId(user.id);
      const response = await createFriendRequest({ receiverId: user.id });
      const requestId = response?.request?.requestId || response?.request?.id || null;
      setSearchResults((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id
            ? { ...item, relationshipStatus: 'requested' as const, friendRequestId: requestId }
            : item
        )
      );
      toast.success(`Friend request sent to ${user.displayName}.`);
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send friend request'));
    } finally {
      setBusyActionId(null);
    }
  };

  const handleCancelRequest = async (user: SearchResultRow) => {
    if (!user.friendRequestId) return;

    try {
      setBusyActionId(user.friendRequestId);
      await cancelFriendRequest({ requestId: user.friendRequestId });
      setSearchResults((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id
            ? { ...item, relationshipStatus: 'none' as const, friendRequestId: null }
            : item
        )
      );
      toast.success('Friend request cancelled.');
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to cancel friend request'));
    } finally {
      setBusyActionId(null);
    }
  };

  const handleAcceptRequest = async (request: FriendRequestItem) => {
    try {
      setBusyActionId(request.requestId);
      await acceptFriendRequest({ requestId: request.requestId });
      setIncomingRequests((prevRequests) =>
        prevRequests.filter((item) => item.requestId !== request.requestId)
      );
      setSearchResults((prevUsers) =>
        prevUsers.map((item) =>
          item.id === request.id
            ? { ...item, relationshipStatus: 'friends' as const, friendRequestId: request.requestId }
            : item
        )
      );
      toast.success('Friend request accepted.');
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to accept request'));
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDeclineRequest = async (request: FriendRequestItem) => {
    try {
      setBusyActionId(request.requestId);
      await declineFriendRequest({ requestId: request.requestId });
      setIncomingRequests((prevRequests) =>
        prevRequests.filter((item) => item.requestId !== request.requestId)
      );
      setSearchResults((prevUsers) =>
        prevUsers.map((item) =>
          item.id === request.id
            ? { ...item, relationshipStatus: 'none' as const, friendRequestId: null }
            : item
        )
      );
      toast.success('Friend request declined.');
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to decline request'));
    } finally {
      setBusyActionId(null);
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    try {
      setBusyActionId(friend.relationshipId);
      await removeFriend({ relationshipId: friend.relationshipId });
      setFriends((prevFriends) =>
        prevFriends.filter((item) => item.relationshipId !== friend.relationshipId)
      );
      toast.success(`${friend.displayName} removed from friends.`);
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove friend'));
    } finally {
      setBusyActionId(null);
    }
  };

  const searchPlaceholder =
    subSection === HOME_SUB_SECTION.friends_all
      ? 'Search friends...'
      : 'Type full name to search users...';

  if (subSection === HOME_SUB_SECTION.friends_all) {
    return (
      <div className="mx-auto w-full max-w-[900px] space-y-5 px-4 py-6">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8d91]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-[#dddfe2] bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {loading && <p className="text-sm text-[#65676b]">Loading friends...</p>}

        <SectionDivider title="All friends" count={friends.length} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              busy={busyActionId === friend.relationshipId}
              onRemoveFriend={handleRemoveFriend}
              onChat={onOpenChatWithFriend}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
        {!loading && friends.length === 0 && !error && (
          <p className="text-sm text-[#65676b]">No friends found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-5 px-4 py-6">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8d91]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-full border border-[#dddfe2] bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-[#65676b]">Loading requests and users...</p>}

      <SectionDivider title="Friend requests" count={incomingRequests.length} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {incomingRequests.map((request) => (
          <FriendRequestCard
            key={request.requestId}
            request={request}
            busy={busyActionId === request.requestId}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            onChat={onOpenChatWithFriend}
            onOpenProfile={onOpenProfile}
          />
        ))}
      </div>
      {!loading && incomingRequests.length === 0 && !error && (
        <p className="text-sm text-[#65676b]">No incoming friend requests.</p>
      )}

      {query && (
        <>
          <SectionDivider title="Search users" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((user) => (
              <UserSearchCard
                key={user.id}
                user={user}
                busy={busyActionId === user.id || Boolean(user.friendRequestId && busyActionId === user.friendRequestId)}
                onAddFriend={handleAddFriend}
                onCancelRequest={handleCancelRequest}
                onChat={onOpenChatWithFriend}
                onOpenProfile={onOpenProfile}
              />
            ))}
          </div>
          {!loading && searchResults.length === 0 && !error && (
            <p className="text-sm text-[#65676b]">No users matched your search.</p>
          )}
        </>
      )}
    </div>
  );
}
