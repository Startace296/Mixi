import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import FeedPostCard from '../home-comp/feed/FeedPostCard';
import PostSkeleton from '../home-comp/feed/PostSkeleton';
import AvatarModal from './profile-section/AvatarModal';
import EditProfileModal from './profile-section/EditProfileModal';
import UserAvatar from './profile-section/UserAvatar';
import { formatDate, type DisplayedProfile } from './profile-section/profileUtils';
import { usePostList } from '../../hooks/post';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  getUserProfile,
  createFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import type {
  AuthUser,
  ChatTarget,
  Id,
  OpenProfileHandler,
  ProfileTarget,
  RelationshipStatus,
  User,
  UserProfile,
} from '../../types';

/** The chat target also carries a name/avatar so the opened thread can show them immediately. */
type ProfileChatTarget = ChatTarget & { displayName?: string; avatarUrl?: string };

interface ProfileSectionViewProps {
  user: AuthUser | null | undefined;
  /** Set when viewing someone else (or yourself via /profile/:id); null for your own profile. */
  viewedProfile: ProfileTarget | null | undefined;
  displayName: string;
  onUserChange?: (user: User) => void;
  onOpenProfile?: OpenProfileHandler;
  onOpenChat?: (target: ProfileChatTarget) => void;
}

export default function ProfileSectionView({ user, viewedProfile, displayName, onUserChange, onOpenProfile, onOpenChat }: ProfileSectionViewProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);

  // --- Other-user profile state ---
  const [fetchedProfile, setFetchedProfile] = useState<UserProfile | null>(null);
  const [relationStatus, setRelationStatus] = useState<RelationshipStatus>('none');
  const [friendRequestId, setFriendRequestId] = useState<Id | null>(null);
  const [relationshipId, setRelationshipId] = useState<Id | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const isOwnProfile =
    !viewedProfile?.id ||
    (user?.id != null && String(viewedProfile.id) === String(user.id));

  const targetUserId = !isOwnProfile && viewedProfile?.id ? String(viewedProfile.id) : null;
  const profilePostAuthorId = isOwnProfile ? user?.id : targetUserId;

  // Visibility of someone's posts depends on the relationship, so a change reloads the list.
  const {
    posts: profilePosts,
    isLoading: postsLoading,
    isLoadingMore: postsLoadingMore,
    hasMore: hasMorePosts,
    error: postsError,
    loadMore: handleLoadMorePosts,
    actions: postActions,
  } = usePostList({
    authorId: profilePostAuthorId,
    enabled: Boolean(profilePostAuthorId),
    reloadKey: `${isOwnProfile}:${relationStatus}`,
  });

  // Fetch other user's full profile + relationship on mount / when target changes
  useEffect(() => {
    if (!targetUserId) {
      setFetchedProfile(null);
      setRelationStatus('none');
      setFriendRequestId(null);
      setRelationshipId(null);
      return;
    }

    let cancelled = false;
    // Captured so the async loader sees a non-null id.
    const userId = targetUserId;
    async function load() {
      setProfileLoading(true);
      try {
        const data = await getUserProfile({ userId });
        if (cancelled) return;
        const u = data?.user;
        if (u) {
          setFetchedProfile(u);
          setRelationStatus(u.relationshipStatus || 'none');
          setFriendRequestId(u.friendRequestId || null);
          setRelationshipId(u.relationshipId || null);
        }
      } catch {
        // keep whatever preview data we have
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [targetUserId]);

  const profileUser: DisplayedProfile | null | undefined = isOwnProfile
    ? user
    : fetchedProfile || { ...viewedProfile };
  const currentName = profileUser?.displayName || displayName || 'User';

  const handleSaved = (nextUser: User) => {
    onUserChange?.(nextUser);
    setAuthUser(nextUser);
  };

  // --- Friend action handlers ---
  const handleAddFriend = async () => {
    if (!targetUserId) return;
    try {
      setActionBusy(true);
      const res = await createFriendRequest({ receiverId: targetUserId });
      const reqId = res?.request?.requestId || res?.request?.id || null;
      setRelationStatus('requested');
      setFriendRequestId(reqId);
      toast.success(`Friend request sent to ${currentName}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send friend request'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!friendRequestId) return;
    try {
      setActionBusy(true);
      await cancelFriendRequest({ requestId: friendRequestId });
      setRelationStatus('none');
      setFriendRequestId(null);
      toast.success('Friend request cancelled.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to cancel friend request'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendRequestId) return;
    try {
      setActionBusy(true);
      await acceptFriendRequest({ requestId: friendRequestId });
      setRelationStatus('friends');
      setFriendRequestId(null);
      toast.success('Friend request accepted!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to accept request'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!friendRequestId) return;
    try {
      setActionBusy(true);
      await declineFriendRequest({ requestId: friendRequestId });
      setRelationStatus('none');
      setFriendRequestId(null);
      toast.success('Friend request declined.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to decline request'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleUnfriend = async () => {
    if (!relationshipId) return;
    try {
      setActionBusy(true);
      await removeFriend({ relationshipId });
      setRelationStatus('none');
      setRelationshipId(null);
      toast.success(`${currentName} removed from friends.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove friend'));
    } finally {
      setActionBusy(false);
    }
  };

  // --- Render action buttons for other user ---
  function renderFriendActionButtons() {
    if (isOwnProfile || profileLoading) return null;

    const chatBtn = (
      <button
        type="button"
        onClick={() => onOpenChat?.({ id: targetUserId ?? undefined, displayName: currentName, avatarUrl: profileUser?.avatarUrl })}
        disabled={actionBusy || !onOpenChat}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Chat
      </button>
    );

    if (relationStatus === 'friends') {
      return (
        <div className="flex shrink-0 gap-2">
          {chatBtn}
          <button
            type="button"
            onClick={handleUnfriend}
            disabled={actionBusy}
            className="rounded-lg border border-[#e4e6eb] px-4 py-2 text-sm font-semibold text-[#1c1e21] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Unfriend
          </button>
        </div>
      );
    }

    if (relationStatus === 'requested') {
      return (
        <div className="flex shrink-0 gap-2">
          {chatBtn}
          <button
            type="button"
            onClick={handleCancelRequest}
            disabled={actionBusy}
            className="rounded-lg border border-[#e4e6eb] px-4 py-2 text-sm font-semibold text-[#1c1e21] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel request
          </button>
        </div>
      );
    }

    if (relationStatus === 'incoming') {
      return (
        <div className="flex shrink-0 gap-2">
          {chatBtn}
          <button
            type="button"
            onClick={handleDeclineRequest}
            disabled={actionBusy}
            className="rounded-lg border border-[#e4e6eb] px-4 py-2 text-sm font-semibold text-[#65676b] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAcceptRequest}
            disabled={actionBusy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Accept
          </button>
        </div>
      );
    }

    // none
    return (
      <div className="flex shrink-0 gap-2">
        {chatBtn}
        <button
          type="button"
          onClick={handleAddFriend}
          disabled={actionBusy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add friend
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-4 px-4 py-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {isOwnProfile ? (
              <button
                type="button"
                onClick={() => setAvatarOpen(true)}
                className="block rounded-full focus:outline-none"
              >
                <UserAvatar user={profileUser} size="xl" />
              </button>
            ) : (
              <UserAvatar user={profileUser} size="xl" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#1c1e21]">{currentName}</h1>
            <p className="mt-1 text-sm text-[#65676b]">
              {isOwnProfile ? user?.bio || 'No bio yet' : profileUser?.bio || '—'}
            </p>
            {isOwnProfile ? <p className="mt-1 text-sm text-[#8a8d91]">0 friend(s)</p> : null}
          </div>
        </div>

        {isOwnProfile ? (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="shrink-0 rounded-lg border border-[#e4e6eb] px-4 py-2 text-sm font-semibold text-[#65676b] transition-colors hover:bg-[#f0f2f5]"
          >
            Edit profile
          </button>
        ) : renderFriendActionButtons()}
      </div>

      <div className="rounded-xl border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
        <h2 className="mb-4 text-base font-bold text-[#1c1e21]">About</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-[#65676b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
            </svg>
            <span className="text-sm text-[#1c1e21]">{profileUser?.gender || '—'}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-[#65676b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-sm text-[#1c1e21]">{formatDate(profileUser?.dateOfBirth)}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-[#65676b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-sm text-[#1c1e21]">{profileUser?.location || '—'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-[#1c1e21]">Posts</h2>
        </div>

        {postsError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {postsError}
          </div>
        ) : null}

        {postsLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : null}

        {profilePosts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            viewerId={user?.id}
            onOpenProfile={onOpenProfile}
            {...postActions}
          />
        ))}

        {postsLoadingMore ? <PostSkeleton /> : null}

        {!postsLoading && !profilePosts.length && !postsError ? (
          <div className="rounded-xl border border-[#e4e6eb] bg-white p-6 text-center shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
            <p className="text-base font-semibold text-[#1c1e21]">No posts yet</p>
            <p className="mt-1 text-sm text-[#65676b]">
              {isOwnProfile ? 'Your future posts will appear here.' : `${currentName} has no visible posts yet.`}
            </p>
          </div>
        ) : null}

        {hasMorePosts && !postsLoading ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLoadMorePosts}
              disabled={postsLoadingMore}
              className="rounded-lg border border-[#e4e6eb] bg-white px-4 py-2 text-sm font-semibold text-[#65676b] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {postsLoadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        ) : null}
      </div>

      {isOwnProfile && editOpen && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {isOwnProfile && avatarOpen && <AvatarModal onClose={() => setAvatarOpen(false)} onSaved={handleSaved} />}
    </div>
  );
}
