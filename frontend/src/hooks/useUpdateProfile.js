import { useState } from 'react';
import toast from 'react-hot-toast';

import { updateMyProfile } from '../lib/api.js';

export function useUpdateProfile({ onSaved, onClose } = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (payload) => {
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
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleUpdateProfile };
}
