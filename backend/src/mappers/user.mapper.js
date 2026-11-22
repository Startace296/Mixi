/** Fields to select/populate when another user's profile is shown (chat, friends, search). */
export const PUBLIC_USER_FIELDS = "displayName avatarUrl provider lastLoginAt createdAt email";

/** Converts a User document into the JSON shape sent to clients (never includes secrets). */
export function sanitizeUser(user) {
  const u = {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    provider: user.provider,
    isEmailVerified: user.isEmailVerified,
    avatarUrl: user.avatarUrl,
    bio: user.bio || "",
    location: user.location || "",
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
  if (user.gender) u.gender = user.gender;
  if (user.dateOfBirth) u.dateOfBirth = user.dateOfBirth;
  return u;
}
