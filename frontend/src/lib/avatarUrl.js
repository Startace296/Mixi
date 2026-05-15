/**
 * Returns a valid avatar URL for display.
 * Falls back to /basic_avatar.jpg (for users) or /basic_group_chat_avatar.png (for groups)
 * when the stored URL is empty or missing.
 */
export function getAvatarUrl(url, type = "user") {
  if (url && typeof url === "string" && url.trim() !== "") return url;
  return type === "group" ? "/basic_group_chat_avatar.png" : "/basic_avatar.jpg";
}
