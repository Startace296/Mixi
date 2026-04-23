import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuthStore } from '../stores/useAuthStore.js';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applyAuthSuccess = useAuthStore((state) => state.applyAuthSuccess);

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      toast.error(error);
      navigate('/login', { replace: true });
      return;
    }

    if (!token || !userRaw) {
      toast.error('Authentication callback is invalid');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      applyAuthSuccess({ token, user });
      toast.success(message || 'Login successful');
      navigate('/home', { replace: true });
    } catch {
      toast.error('Authentication callback is invalid');
      navigate('/login', { replace: true });
    }
  }, [applyAuthSuccess, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
      <p className="text-sm text-[#65676b]">Finishing sign in...</p>
    </div>
  );
}
