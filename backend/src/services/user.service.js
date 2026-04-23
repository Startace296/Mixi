import sharp from "sharp";
import { Readable } from "node:stream";

import User from "../models/User.js";
import { getCloudinary } from "../config/cloudinary.js";
import { AppError } from "../utils/app-error.js";

const MAX_BIO_CHARACTERS = 280;
const MAX_BIO_LINES = 4;

function ensureAdult(birthDate) {
  const today = new Date();
  const minAllowedDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  if (birthDate > minAllowedDate) {
    throw new AppError("You must be at least 18 years old", 400);
  }
}

function parseDateOfBirth(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    throw new AppError("Date of birth is invalid", 400);
  }

  ensureAdult(birthDate);
  return birthDate;
}

function normalizeBio(bio) {
  const value = typeof bio === "string" ? bio.trim() : "";

  if (!value) return "";

  if (value.length > MAX_BIO_CHARACTERS) {
    throw new AppError(`Bio must be at most ${MAX_BIO_CHARACTERS} characters long`, 400);
  }

  const lineCount = value.replace(/\r\n?/g, "\n").split("\n").length;
  if (lineCount > MAX_BIO_LINES) {
    throw new AppError(`Bio must be at most ${MAX_BIO_LINES} lines long`, 400);
  }

  return value;
}

function sanitizeUser(user) {
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

function getAvatarPublicId(userId) {
  return String(userId);
}

async function uploadBufferToCloudinary(buffer, publicId) {
  const cloudinary = getCloudinary();

  const processedBuffer = await sharp(buffer)
    .rotate()
    .resize(512, 512, {
      fit: "cover",
      position: "center",
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "chatapp/avatars",
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      },
    );

    Readable.from([processedBuffer]).pipe(uploadStream);
  });
}

export async function getCurrentUserProfile(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
}

export async function updateCurrentUserProfile(
  userId,
  { displayName, gender, dateOfBirth, bio = "", location = "" },
) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

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
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!file?.buffer) {
    throw new AppError("Avatar file is required", 400);
  }

  const allowedMimeTypes = new Set(["image/png", "image/jpeg"]);
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new AppError("Only PNG and JPEG images are allowed", 400);
  }

  try {
    const result = await uploadBufferToCloudinary(file.buffer, getAvatarPublicId(userId));

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
