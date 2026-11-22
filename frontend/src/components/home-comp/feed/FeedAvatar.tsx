import { getAvatarUrl } from "../../../lib/format";
import type { User } from "../../../types";

interface FeedAvatarProps {
  user: Pick<User, "avatarUrl"> | null | undefined;
  displayName?: string;
  className?: string;
}

export default function FeedAvatar({ user, displayName, className = "h-10 w-10 text-sm" }: FeedAvatarProps) {
  return (
    <img
      src={getAvatarUrl(user?.avatarUrl)}
      alt={displayName || ""}
      onError={(e) => { e.currentTarget.src = "/basic_avatar.jpg"; }}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
