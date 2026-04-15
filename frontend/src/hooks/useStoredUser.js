import { useState, useEffect } from 'react';

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** User object from localStorage (set after login). */
export function useStoredUser() {
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  return user;
}
