import { getAvatarUrl } from "../../../../lib/format";

export default function CommentAvatar({ avatarUrl, authorName, sm }: { avatarUrl?: string; authorName?: string; sm?: boolean }) {
  const box = sm ? "h-7 w-7" : "h-8 w-8";
  return (
    <img
      src={getAvatarUrl(avatarUrl)}
      alt={authorName}
      onError={(e) => { e.currentTarget.src = "/basic_avatar.jpg"; }}
      className={`${box} shrink-0 rounded-full object-cover ring-1 ring-black/5`}
    />
  );
}
