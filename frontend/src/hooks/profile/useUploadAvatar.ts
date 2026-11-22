import { useState } from 'react';
import toast from 'react-hot-toast';

import { uploadMyAvatar } from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import type { User } from '../../types';

const ALLOWED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg']);
const MAX_AVATAR_BYTES = 1024 * 1024;

interface UseUploadAvatarOptions {
  onSaved?: (user: User) => void;
  onClose?: () => void;
}

export type AvatarFileCheck = { valid: true } | { valid: false; message: string };

export function useUploadAvatar({ onSaved, onClose }: UseUploadAvatarOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const validateAvatarFile = (file: File | null | undefined): AvatarFileCheck => {
    if (!file) return { valid: false, message: 'Avatar file is required.' };
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      return { valid: false, message: 'Only PNG and JPEG images are allowed.' };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { valid: false, message: 'Avatar image must be 1 MB or smaller.' };
    }
    return { valid: true };
  };

  const handleUploadAvatar = async (file: File | null | undefined): Promise<boolean> => {
    if (isLoading) return false;

    const check = validateAvatarFile(file);
    if (!check.valid) {
      toast.error(check.message);
      return false;
    }
    // validateAvatarFile already rejected a missing file; this narrows the type.
    if (!file) return false;

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
      toast.error(getErrorMessage(error, 'Upload failed'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleUploadAvatar, validateAvatarFile };
}
