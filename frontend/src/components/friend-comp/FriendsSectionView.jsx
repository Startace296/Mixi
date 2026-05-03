import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
  acceptFriendRequest,
  cancelFriendRequest,
  createFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
  searchUsers,
} from '../../lib/api.js';
import { HOME_SUB_SECTION } from '../../lib/homeSections.js';
import { FRIEND_SOCKET_EVENTS, getAuthenticatedSocket } from '../../lib/socket.js';

function getInitials(displayName) {
  const parts = (displayName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function SectionDivider({ title, count }) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <h2 className="text-base font-bold text-[#1c1e21]">{title}</h2>
      {count != null && <span className="text-xs font-medium text-[#8a8d91]">{count} people</span>}
    </div>
  );
}

function Avatar({ displayName, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-black/5"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700">
      {getInitials(displayName)}
    </div>
  );
}

/** Payload for profile preview — no email (privacy). */
function toFriendProfilePreview(entry) {
  const rawId = entry?.id ?? entry?.friendId ?? entry?.userId;
  const preview = {
    displayName: entry?.displayName || '',
    avatarUrl: entry?.avatarUrl || '',
  };
  if (rawId != null) {
    preview.id = String(rawId);
  }
  return preview;
}

function ProfileHitArea({ source, onOpenProfile, displayName, avatarUrl }) {
  const open = () => onOpenProfile?.(toFriendProfilePreview(source));
  const disabled = !onOpenProfile;

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <button
        type="button"
        onClick={open}
        disabled={disabled}
        className="shrink-0 rounded-full focus:outline-none disabled:cursor-default disabled:opacity-60"
        aria-label={`Open ${displayName || 'user'} profile`}
      >
        <Avatar displayName={displayName} avatarUrl={avatarUrl} />
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className="truncate text-left text-sm font-semibold text-[#1c1e21] hover:underline disabled:cursor-default disabled:text-[#65676b] disabled:no-underline"
        >
          {displayName}
        </button>
      </div>
    </div>
  );
}

function FriendRequestCard({ request, onAccept, onDecline, busy, onOpenProfile }) {
  return (
    <div className="flex min-h-[140px] flex-col gap-4 rounded-lg border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <ProfileHitArea
        source={request}
        onOpenProfile={onOpenProfile}
        displayName={request.displayName}
        avatarUrl={request.avatarUrl}
      />
      <div className="mt-auto flex w-full gap-2">
        <button
          type="button"
          onClick={() => onAccept(request)}
          disabled={busy}
          className="flex-1 rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => onDecline(request)}
          disabled={busy}
          className="flex-1 rounded-full border border-[#e4e6eb] py-2 text-sm font-semibold text-[#65676b] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function UserSearchCard({ user, onAddFriend, onCancelRequest, onChat, busy, onOpenProfile }) {
  const relationshipStatus = user.relationshipStatus || 'none';
  const isActionDisabled = relationshipStatus === 'friends' || relationshipStatus === 'incoming';
  const canChat = relationshipStatus === 'friends' && Boolean(onChat);
  const buttonLabel =
    relationshipStatus === 'friends'
      ? 'Friends'
      : relationshipStatus === 'requested'
        ? 'Cancel request'
        : relationshipStatus === 'incoming'
          ? 'Requested you'
        : 'Add friend';
  const buttonClassName = relationshipStatus === 'requested'
    ? 'flex-1 rounded-full border border-[#e4e6eb] py-2 text-sm font-semibold text-[#1c1e21] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60'
    : 'flex-1 rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-[#ccd0d5] disabled:text-[#65676b]';

  return (
    <div className="flex min-h-[140px] flex-col gap-4 rounded-lg border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <ProfileHitArea
        source={user}
        onOpenProfile={onOpenProfile}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
      />
      <div className="mt-auto flex w-full gap-2">
        <button
          type="button"
          onClick={() => onChat?.(user)}
          disabled={busy || !canChat}
          className="flex-1 rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => {
            if (relationshipStatus === 'requested') {
              onCancelRequest(user);
              return;
            }
            onAddFriend(user);
          }}
          disabled={busy || isActionDisabled}
          className={buttonClassName}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function FriendCard({ friend, onRemoveFriend, onChat, busy, onOpenProfile }) {
  return (
    <div className="flex min-h-[140px] flex-col gap-4 rounded-lg border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <ProfileHitArea
        source={friend}
        onOpenProfile={onOpenProfile}
        displayName={friend.displayName}
        avatarUrl={friend.avatarUrl}
      />
      <div className="mt-auto flex w-full gap-2">
        <button
          type="button"
          onClick={() => onChat(friend)}
          disabled={busy || !onChat}
          className="flex-1 rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => onRemoveFriend(friend)}
          disabled={busy}
          className="flex-1 rounded-full border border-[#e4e6eb] py-2 text-sm font-semibold text-[#1c1e21] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Unfriend
        </button>
      </div>
    </div>
  );
}

export default function FriendsSectionView({ subSection, onOpenChatWithFriend, onOpenProfile }) {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [busyActionId, setBusyActionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const query = debouncedSearchText.trim();

  async function fetchSectionData(activeSubSection = subSection, activeQuery = query) {
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

  function applySectionData(data) {
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
          setError(err.message || 'Failed to load friends');
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
      setError(err.message || 'Failed to load friends');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleAddFriend = async (user) => {
    try {
      setBusyActionId(user.id);
      const response = await createFriendRequest({ receiverId: user.id });
      const requestId = response?.request?.requestId || response?.request?.id || null;
      setSearchResults((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id
            ? { ...item, relationshipStatus: 'requested', friendRequestId: requestId }
            : item
        )
      );
      toast.success(`Friend request sent to ${user.displayName}.`);
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to send friend request');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleCancelRequest = async (user) => {
    if (!user.friendRequestId) return;

    try {
      setBusyActionId(user.friendRequestId);
      await cancelFriendRequest({ requestId: user.friendRequestId });
      setSearchResults((prevUsers) =>
        prevUsers.map((item) =>
          item.id === user.id
            ? { ...item, relationshipStatus: 'none', friendRequestId: null }
            : item
        )
      );
      toast.success('Friend request cancelled.');
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to cancel friend request');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      setBusyActionId(request.requestId);
      await acceptFriendRequest({ requestId: request.requestId });
      setIncomingRequests((prevRequests) =>
        prevRequests.filter((item) => item.requestId !== request.requestId)
      );
      setSearchResults((prevUsers) =>
        prevUsers.map((item) =>
          item.id === request.id
            ? { ...item, relationshipStatus: 'friends', friendRequestId: request.requestId }
            : item
        )
      );
      toast.success('Friend request accepted.');
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to accept request');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDeclineRequest = async (request) => {
    try {
      setBusyActionId(request.requestId);
      await declineFriendRequest({ requestId: request.requestId });
      setIncomingRequests((prevRequests) =>
        prevRequests.filter((item) => item.requestId !== request.requestId)
      );
      setSearchResults((prevUsers) =>
        prevUsers.map((item) =>
          item.id === request.id
            ? { ...item, relationshipStatus: 'none', friendRequestId: null }
            : item
        )
      );
      toast.success('Friend request declined.');
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to decline request');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleRemoveFriend = async (friend) => {
    try {
      setBusyActionId(friend.relationshipId);
      await removeFriend({ relationshipId: friend.relationshipId });
      setFriends((prevFriends) =>
        prevFriends.filter((item) => item.relationshipId !== friend.relationshipId)
      );
      toast.success(`${friend.displayName} removed from friends.`);
      void refreshCurrentSection({ showLoading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to remove friend');
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
                busy={busyActionId === user.id || (user.friendRequestId && busyActionId === user.friendRequestId)}
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
