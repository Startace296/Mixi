import { useState } from 'react';
import toast from 'react-hot-toast';

import { updateMyProfile } from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import type { UpdateProfileParams, User } from '../../types';

interface UseUpdateProfileOptions {
  onSaved?: (user: User) => void;
  onClose?: () => void;
}

export function useUpdateProfile({ onSaved, onClose }: UseUpdateProfileOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (payload: UpdateProfileParams): Promise<boolean> => {
    if (isLoading) return false;

    setIsLoading(true);
    try {
      const response = await updateMyProfile(payload);
      if (response?.user) {
        onSaved?.(response.user);
      }
      toast.success(response?.message || 'Profile updated successfully.');
      onClose?.();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update profile'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleUpdateProfile };
}
