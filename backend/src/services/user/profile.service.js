import FriendRequest from "../../models/FriendRequest.js";
import User from "../../models/User.js";
import { isAllowedImageType, uploadUserAvatar } from "../../lib/image-upload.js";
import { sanitizeUser } from "../../mappers/user.mapper.js";
import { AppError } from "../../utils/app-error.js";
import { getRelationshipStatus, normalizeBio, parseDateOfBirth } from "./user.helpers.js";

async function findUserOrThrow(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

export async function getCurrentUserProfile(userId) {
  const user = await findUserOrThrow(userId);
  return sanitizeUser(user);
}

export async function getUserProfileById(currentUserId, targetUserId) {
  const targetId = String(targetUserId);
  const currentId = String(currentUserId);

  const user = await User.findById(targetId);
  if (!user || !user.isEmailVerified) {
    throw new AppError("User not found", 404);
  }

  const base = sanitizeUser(user);

  if (currentId === targetId) {
    return { ...base, relationshipStatus: "self", friendRequestId: null, relationshipId: null };
  }

  const relation = await FriendRequest.findOne({
    $or: [
      { requestedById: currentId, receiverId: targetId },
      { requestedById: targetId, receiverId: currentId },
    ],
  }).select("requestedById receiverId status");

  if (!relation) {
    return { ...base, relationshipStatus: "none", friendRequestId: null, relationshipId: null };
  }

  return {
    ...base,
    relationshipStatus: getRelationshipStatus(relation, currentId),
    friendRequestId: relation.status !== "accepted" ? String(relation._id) : null,
    relationshipId: relation.status === "accepted" ? String(relation._id) : null,
  };
}

export async function updateCurrentUserProfile(
  userId,
  { displayName, gender, dateOfBirth, bio = "", location = "" },
) {
  const user = await findUserOrThrow(userId);

  if (!displayName?.trim()) {
    throw new AppError("Display name is required", 400);
  }

  if (!["Male", "Female", "Other"].includes(gender)) {
    throw new AppError("Please select a valid gender", 400);
  }

  const birthDate = parseDateOfBirth(dateOfBirth);

  user.displayName = displayName.trim();
  user.gender = gender;
  user.dateOfBirth = birthDate;
  user.bio = normalizeBio(bio);
  user.location = typeof location === "string" ? location.trim() : "";

  await user.save();

  return sanitizeUser(user);
}

export async function updateCurrentUserAvatar(userId, file) {
  const user = await findUserOrThrow(userId);

  if (!file?.buffer) {
    throw new AppError("Avatar file is required", 400);
  }

  if (!isAllowedImageType(file)) {
    throw new AppError("Only PNG and JPEG images are allowed", 400);
  }

  try {
    const result = await uploadUserAvatar(file.buffer, userId);

    if (!result?.secure_url) {
      throw new AppError("Failed to upload avatar", 500);
    }

    user.avatarUrl = result.secure_url;
    await user.save();

    return sanitizeUser(user);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || "Failed to upload avatar", 500);
  }
}
