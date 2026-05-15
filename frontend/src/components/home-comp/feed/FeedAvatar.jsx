import { getAvatarUrl } from "../../../lib/avatarUrl.js";

export default function FeedAvatar({ user, displayName, className = "h-10 w-10 text-sm" }) {
  return (
    <img
      src={getAvatarUrl(user?.avatarUrl)}
      alt={displayName || ""}
      onError={(e) => { e.currentTarget.src = "/basic_avatar.jpg"; }}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
