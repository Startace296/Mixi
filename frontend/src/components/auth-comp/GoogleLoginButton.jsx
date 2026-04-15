import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleLogin } from '../../services/api.js';
import { saveAuthSuccess } from '../../utils/authUtils.js';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton({ className = '', onSuccess }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const initRef = useRef(false);

  const handleCredential = async (response) => {
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
        saveAuthSuccess(data);
        toast.success(data.message || 'Login successful');
        if (onSuccess) onSuccess();
        else navigate('/home');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (!clientId || !containerRef.current || initRef.current) return;

    const init = () => {
      if (!window.google?.accounts?.id) return;
      initRef.current = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(containerRef.current, {
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
