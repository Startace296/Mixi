import type { SearchResultRow } from './friendsData';
import { getAvatarUrl } from '../../../lib/format';
import type {
  Friend,
  FriendRequestItem,
  Id,
  OpenChatHandler as OpenChat,
  OpenProfileHandler as OpenProfile,
  ProfileTarget,
} from '../../../types';

/** Anything a profile can be opened from: `id`, then `friendId`, then `userId` is used. */
interface ProfileEntry {
  id?: Id;
  friendId?: Id;
  userId?: Id;
  displayName?: string;
  avatarUrl?: string;
}

export function SectionDivider({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <h2 className="text-base font-bold text-[#1c1e21]">{title}</h2>
      {count != null && <span className="text-xs font-medium text-[#8a8d91]">{count} people</span>}
    </div>
  );
}

function Avatar({ displayName, avatarUrl }: { displayName?: string; avatarUrl?: string }) {
  return (
    <img
      src={getAvatarUrl(avatarUrl)}
      alt={displayName}
      onError={(e) => { e.currentTarget.src = '/basic_avatar.jpg'; }}
      className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-black/5"
    />
  );
}

function profilePayloadFromEntry(entry: ProfileEntry | null | undefined): ProfileTarget | null {
  const rawId = entry?.id ?? entry?.friendId ?? entry?.userId;
  if (rawId == null || String(rawId).length === 0) return null;
  const payload: ProfileTarget = { id: String(rawId) };
  if (entry?.displayName) payload.displayName = entry.displayName;
  if (entry?.avatarUrl) payload.avatarUrl = entry.avatarUrl;
  return payload;
}

interface ProfileHitAreaProps {
  entry: ProfileEntry;
  onOpenProfile?: OpenProfile;
  displayName?: string;
  avatarUrl?: string;
}

function ProfileHitArea({ entry, onOpenProfile, displayName, avatarUrl }: ProfileHitAreaProps) {
  const payload = profilePayloadFromEntry(entry);
  const open = () => {
    if (payload) onOpenProfile?.(payload);
  };
  const disabled = !payload || !onOpenProfile;

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

interface FriendRequestCardProps {
  request: FriendRequestItem;
  onAccept: (request: FriendRequestItem) => void;
  onDecline: (request: FriendRequestItem) => void;
  onChat: OpenChat;
  busy: boolean;
  onOpenProfile?: OpenProfile;
}

export function FriendRequestCard({ request, onAccept, onDecline, onChat, busy, onOpenProfile }: FriendRequestCardProps) {
  return (
    <div className="flex min-h-[140px] flex-col gap-4 rounded-lg border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <ProfileHitArea
        entry={request}
        onOpenProfile={onOpenProfile}
        displayName={request.displayName}
        avatarUrl={request.avatarUrl}
      />
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex w-full gap-2">
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
        {onChat && (
          <button
            type="button"
            onClick={() => onChat(request)}
            className="w-full rounded-full border border-indigo-200 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Chat
          </button>
        )}
      </div>
    </div>
  );
}

interface UserSearchCardProps {
  user: SearchResultRow;
  onAddFriend: (user: SearchResultRow) => void;
  onCancelRequest: (user: SearchResultRow) => void;
  onChat?: OpenChat;
  onUnfriend?: (user: SearchResultRow) => void;
  busy: boolean;
  onOpenProfile?: OpenProfile;
}

export function UserSearchCard({ user, onAddFriend, onCancelRequest, onChat, onUnfriend, busy, onOpenProfile }: UserSearchCardProps) {
  const relationshipStatus = user.relationshipStatus || 'none';
  const isFriends = relationshipStatus === 'friends';

  const actionLabel =
    isFriends ? 'Unfriend'
    : relationshipStatus === 'requested' ? 'Cancel request'
    : relationshipStatus === 'incoming' ? 'Requested you'
    : 'Add friend';

  const actionDisabled =
    busy ||
    (isFriends && (!onUnfriend || !user.relationshipId)) ||
    (relationshipStatus === 'incoming');

  const actionClassName = (isFriends || relationshipStatus === 'requested')
    ? 'flex-1 rounded-full border border-[#e4e6eb] py-2 text-sm font-semibold text-[#1c1e21] transition-colors hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60'
    : 'flex-1 rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-[#ccd0d5] disabled:text-[#65676b]';

  const handleAction = () => {
    if (isFriends) { onUnfriend?.(user); return; }
    if (relationshipStatus === 'requested') { onCancelRequest(user); return; }
    onAddFriend(user);
  };

  return (
    <div className="flex min-h-[140px] flex-col gap-4 rounded-lg border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <ProfileHitArea entry={user} onOpenProfile={onOpenProfile} displayName={user.displayName} avatarUrl={user.avatarUrl} />
      <div className="mt-auto flex w-full gap-2">
        <button
          type="button"
          onClick={() => onChat?.(user)}
          disabled={busy || !onChat}
          className="flex-1 rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Chat
        </button>
        <button
          type="button"
          onClick={handleAction}
          disabled={actionDisabled}
          className={actionClassName}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

interface FriendCardProps {
  friend: Friend;
  onRemoveFriend: (friend: Friend) => void;
  onChat: OpenChat;
  busy: boolean;
  onOpenProfile?: OpenProfile;
}

export function FriendCard({ friend, onRemoveFriend, onChat, busy, onOpenProfile }: FriendCardProps) {
  return (
    <div className="flex min-h-[140px] flex-col gap-4 rounded-lg border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <ProfileHitArea
        entry={friend}
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
