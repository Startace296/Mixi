/**
 * Returns a valid avatar URL for display.
 * Falls back to /basic_avatar.jpg (for users) or /basic_group_chat_avatar.png (for groups)
 * when the stored URL is empty or missing.
 */
export type AvatarType = "user" | "group";

/** A conversation type can be passed directly: "direct" falls back to the user avatar. */
export function getAvatarUrl(url: string | null | undefined, type: AvatarType | "direct" = "user"): string {
  if (url && typeof url === "string" && url.trim() !== "") return url;
  return type === "group" ? "/basic_group_chat_avatar.png" : "/basic_avatar.jpg";
}
