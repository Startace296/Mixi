import { create } from 'zustand';
import type { AuthSuccessPayload, AuthUser } from '../types';

interface AuthState {
  token: string | null;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  setToken: (token: string | null | undefined) => void;
  setAuthUser: (authUser: AuthUser | null | undefined) => void;
  applyAuthSuccess: (data: AuthSuccessPayload | null | undefined) => void;
  clearAuth: () => void;
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const initialToken = localStorage.getItem('token');
const initialUser = readStoredUser();

export const useAuthStore = create<AuthState>()((set) => ({
  token: initialToken || null,
  authUser: initialUser,
  isAuthenticated: Boolean(initialToken),

  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set((state) => ({
      ...state,
      token: token || null,
      isAuthenticated: Boolean(token),
    }));
  },

  setAuthUser: (authUser) => {
    if (authUser) localStorage.setItem('user', JSON.stringify(authUser));
    else localStorage.removeItem('user');
    set((state) => ({ ...state, authUser: authUser || null }));
  },

  applyAuthSuccess: (data) => {
    const token = data?.token || null;
    const authUser = data?.user || null;

    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    if (authUser) localStorage.setItem('user', JSON.stringify(authUser));
    else localStorage.removeItem('user');

    set((state) => ({
      ...state,
      token,
      authUser,
      isAuthenticated: Boolean(token),
    }));
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set((state) => ({
      ...state,
      token: null,
      authUser: null,
      isAuthenticated: false,
    }));
  },
}));
