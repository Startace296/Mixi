import { useState } from 'react';
import toast from 'react-hot-toast';

import { uploadMyAvatar } from '../lib/api.js';

const ALLOWED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg']);
const MAX_AVATAR_BYTES = 1024 * 1024;

export function useUploadAvatar({ onSaved, onClose } = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const validateAvatarFile = (file) => {
    if (!file) return { valid: false, message: 'Avatar file is required.' };
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      return { valid: false, message: 'Only PNG and JPEG images are allowed.' };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { valid: false, message: 'Avatar image must be 1 MB or smaller.' };
    }
    return { valid: true };
  };

  const handleUploadAvatar = async (file) => {
    if (isLoading) return false;

    const check = validateAvatarFile(file);
    if (!check.valid) {
      toast.error(check.message);
      return false;
    }

    setIsLoading(true);
    try {
      const response = await uploadMyAvatar(file);
      if (response?.user) {
        onSaved?.(response.user);
      }
      toast.success(response?.message || 'Profile photo updated successfully.');
      onClose?.();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Upload failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleUploadAvatar, validateAvatarFile };
}
