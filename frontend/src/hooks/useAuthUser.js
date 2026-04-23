import { useCallback, useEffect, useState } from 'react';

import { getMyProfile } from '../lib/api.js';
import { useAuthStore } from '../stores/useAuthStore.js';

export function useAuthUser() {
  const authUser = useAuthStore((state) => state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem('token')));

  const refreshAuthUser = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setAuthUser(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const data = await getMyProfile();
      const nextUser = data?.user || null;
      setAuthUser(nextUser);
      return nextUser;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setAuthUser]);

  useEffect(() => {
    refreshAuthUser();
  }, [refreshAuthUser]);

  return { authUser, isLoading, refreshAuthUser, setAuthUser };
}
