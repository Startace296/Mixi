import { useState } from "react";

export default function FeedAvatar({ user, displayName, className = "h-10 w-10 text-sm" }) {
  const [imgError, setImgError] = useState(false);
  const initial = displayName?.[0]?.toUpperCase() || "?";

  if (user?.avatarUrl && !imgError) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        onError={() => setImgError(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${className}`}
    >
      {initial}
    </div>
  );
}
