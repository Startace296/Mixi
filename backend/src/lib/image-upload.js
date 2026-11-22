import sharp from "sharp";
import { Readable } from "node:stream";

import { getCloudinary } from "../config/cloudinary.js";

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

export function isAllowedImageType(file) {
  return ALLOWED_IMAGE_MIME_TYPES.has(file?.mimetype);
}

/**
 * Normalises an image with sharp (auto-rotate, resize, JPEG) and streams it to Cloudinary.
 * `resize` is [width, height, sharpResizeOptions]; `upload` is passed to Cloudinary.
 */
async function uploadImageBuffer(buffer, { resize, flatten, quality = 86, upload }) {
  const cloudinary = getCloudinary();

  let image = sharp(buffer).rotate().resize(...resize);
  if (flatten) image = image.flatten(flatten);
  const processedBuffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "image", ...upload },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      },
    );

    Readable.from([processedBuffer]).pipe(uploadStream);
  });
}

export function uploadChatImage(buffer) {
  return uploadImageBuffer(buffer, {
    resize: [1600, 1600, { fit: "inside", withoutEnlargement: true }],
    upload: { folder: "chatapp/messages" },
  });
}

export function uploadGroupAvatar(buffer) {
  return uploadImageBuffer(buffer, {
    resize: [512, 512, { fit: "cover", withoutEnlargement: false }],
    upload: { folder: "chatapp/group-avatars" },
  });
}

export function uploadPostImage(buffer) {
  return uploadImageBuffer(buffer, {
    resize: [1800, 1800, { fit: "inside", withoutEnlargement: true }],
    upload: { folder: "chatapp/posts" },
  });
}

/** One avatar per user: the public id is the user id, so a new upload replaces the old one. */
export function uploadUserAvatar(buffer, userId) {
  return uploadImageBuffer(buffer, {
    resize: [512, 512, { fit: "cover", position: "center" }],
    flatten: { background: "#ffffff" },
    quality: 85,
    upload: {
      public_id: String(userId),
      folder: "chatapp/avatars",
      overwrite: true,
      invalidate: true,
    },
  });
}
