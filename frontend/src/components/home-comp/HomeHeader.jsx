import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { BrandMark } from '../auth-comp/AuthSiteChrome';
import { logout } from '../../lib/api.js';
import { HOME_SECTION } from '../../lib/homeSections.js';
import { disconnectAuthenticatedSocket } from '../../lib/socket.js';
import { useAuthStore } from '../../stores/useAuthStore.js';

function UserAvatar({ user, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const label = (
    user?.displayName?.[0] ||
    user?.username?.[0] ||
    user?.email?.[0] ||
    '?'
  ).toUpperCase();

  if (user?.avatarUrl && !imgError) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        onError={() => setImgError(true)}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center ${className}`}
      aria-hidden
    >
      {label}
    </div>
  );
}

export default function HomeHeader({ user, onSelectSection }) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName =
    user?.displayName ||
    user?.username ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'You';

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
    } catch {
      // silent
    } finally {
      disconnectAuthenticatedSocket();
      clearAuth();
      toast.success('Logout successful');
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#e4e6eb] shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.04)]">
      <div className="h-full max-w-[1600px] mx-auto px-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSelectSection(HOME_SECTION.home)}
          className="flex items-center gap-2 shrink-0 rounded-lg p-1 -ml-1 hover:bg-[#f0f2f5] transition-colors"
        >
          <BrandMark size="md" />
        </button>
        
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#65676b] hover:bg-[#f0f2f5] transition-colors"
            aria-label="Notifications"
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
          </button>

          <div className="relative pl-1 border-l border-[#e4e6eb] ml-1" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#f0f2f5] transition-colors"
            >
              <UserAvatar user={user} className="w-9 h-9 text-sm" />
              <p className="text-sm font-semibold text-[#1c1e21] truncate max-w-[120px]">{displayName}</p>
              <svg className="w-4 h-4 text-[#8a8d91] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-[#e4e6eb] py-1.5 z-50">
                <div className="px-4 py-3 border-b border-[#f0f2f5]">
                  <p className="text-sm font-semibold text-[#1c1e21] truncate">{displayName}</p>
                </div>
                
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onSelectSection(HOME_SECTION.profile); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#1c1e21] font-medium hover:bg-[#f0f2f5] transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-[#65676b]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.925 20.056a6 6 0 0 0-11.851.001" />
                      <circle cx="12" cy="11" r="4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#e53935] font-medium hover:bg-[#fff5f5] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
