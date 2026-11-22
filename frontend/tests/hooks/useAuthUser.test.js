import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useAuthUser } from '../../src/hooks/auth';
import { getMyProfile } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/useAuthStore';

vi.mock('../../src/lib/api');

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().clearAuth();
});

describe('useAuthUser', () => {
  it('skips the request and clears the user when there is no token', async () => {
    useAuthStore.setState({ authUser: { id: 'stale' } });
    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getMyProfile).not.toHaveBeenCalled();
    expect(result.current.authUser).toBeNull();
  });

  it('loads the profile when a token exists and saves it to the store', async () => {
    localStorage.setItem('token', 'jwt');
    getMyProfile.mockResolvedValue({ user: { id: 'u1', displayName: 'Alice' } });

    const { result } = renderHook(() => useAuthUser());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.authUser).toEqual({ id: 'u1', displayName: 'Alice' });
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 'u1', displayName: 'Alice' });
  });

  it('keeps the cached user when the profile request fails', async () => {
    localStorage.setItem('token', 'jwt');
    useAuthStore.getState().setAuthUser({ id: 'cached' });
    getMyProfile.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAuthUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.authUser).toEqual({ id: 'cached' });
  });
});
