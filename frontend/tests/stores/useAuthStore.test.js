import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '../../src/stores/useAuthStore';

const store = () => useAuthStore.getState();

beforeEach(() => {
  store().clearAuth();
});

describe('useAuthStore', () => {
  it('applyAuthSuccess saves token and user to state and localStorage', () => {
    store().applyAuthSuccess({ token: 'jwt', user: { id: 'u1' } });

    expect(store()).toMatchObject({ token: 'jwt', authUser: { id: 'u1' }, isAuthenticated: true });
    expect(localStorage.getItem('token')).toBe('jwt');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 'u1' });
  });

  it('applyAuthSuccess without a token logs the user out', () => {
    store().applyAuthSuccess({ token: 'jwt', user: { id: 'u1' } });
    store().applyAuthSuccess({});

    expect(store()).toMatchObject({ token: null, authUser: null, isAuthenticated: false });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('setToken and setAuthUser update one piece at a time', () => {
    store().setToken('jwt');
    expect(store().isAuthenticated).toBe(true);
    store().setAuthUser({ id: 'u1' });
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 'u1' });

    store().setToken(null);
    expect(store().isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(store().authUser).toEqual({ id: 'u1' });
  });

  it('clearAuth removes everything', () => {
    store().applyAuthSuccess({ token: 'jwt', user: { id: 'u1' } });
    store().clearAuth();

    expect(store()).toMatchObject({ token: null, authUser: null, isAuthenticated: false });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
