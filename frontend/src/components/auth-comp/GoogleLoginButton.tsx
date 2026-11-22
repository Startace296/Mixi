import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleLogin } from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import { useAuthStore } from '../../stores/useAuthStore';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton({ className = '', onSuccess }: { className?: string; onSuccess?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const initRef = useRef(false);
  const applyAuthSuccess = useAuthStore((state) => state.applyAuthSuccess);

  // Google's SDK is initialised once, so its callback goes through this ref to
  // always reach the latest handleCredential (fresh navigate/onSuccess).
  const handleCredentialRef = useRef<((response: GoogleCredentialResponse) => void) | null>(null);

  const handleCredential = async (response: GoogleCredentialResponse) => {
    try {
      const data = await googleLogin({ idToken: response.credential });
      if (data.isNewUser) {
        navigate('/register', {
          state: {
            email: data.email,
            fromGoogle: true,
            googleSignupToken: data.googleSignupToken,
            displayName: data.displayName,
          },
        });
      } else {
        applyAuthSuccess(data);
        toast.success(data.message || 'Login successful');
        if (onSuccess) onSuccess();
        else navigate('/home', { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  handleCredentialRef.current = handleCredential;

  useEffect(() => {
    if (!clientId || !containerRef.current || initRef.current) return;

    const init = () => {
      const googleId = window.google?.accounts?.id;
      const container = containerRef.current;
      if (!googleId || !container) return;
      initRef.current = true;
      googleId.initialize({
        client_id: clientId,
        callback: (response) => handleCredentialRef.current?.(response),
      });
      googleId.renderButton(container, {
        theme: 'filled_black',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        width: 400,
      });
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      const check = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(check);
          init();
        }
      }, 100);
      return () => clearInterval(check);
    }
    return undefined;
  }, []);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full px-3 py-2.5 text-base font-semibold rounded-full border-none bg-gray-200 text-gray-500 cursor-not-allowed"
      >
        Google
      </button>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="w-full px-3 py-2.5 text-base font-semibold rounded-full border-none bg-[#ea4335] text-white text-center pointer-events-none"
      >
        Google
      </div>
      <div
        ref={containerRef}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />
    </div>
  );
}
