import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { BrandMark } from '../auth-comp/AuthSiteChrome';
import { logout } from '../../services/api.js';

function UserAvatar({ user, className = '' }) {
  const label =
    user?.displayName?.[0] ||
    user?.username?.[0] ||
    user?.email?.[0] ||
    '?';
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center uppercase ${className}`}
      aria-hidden
    >
      {label}
    </div>
  );
}

export default function HomeHeader({ user }) {
  const navigate = useNavigate();
  const displayName =
    user?.displayName ||
    user?.username ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'Bạn';

  const handleLogout = async () => {
    try {
      const data = await logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success(data.message || 'Đăng xuất thành công');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#e4e6eb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="h-full max-w-[1600px] mx-auto px-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 shrink-0 rounded-lg p-1 -ml-1 hover:bg-[#f0f2f5] transition-colors"
        >
          <BrandMark size="md" />
        </button>

        <div className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8d91]" aria-hidden>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Tìm trên MixiChat..."
              readOnly
              className="w-full h-10 pl-10 pr-4 rounded-full bg-[#f0f2f5] border-0 text-sm text-[#1c1e21] placeholder:text-[#8a8d91] outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-default"
              aria-label="Tìm kiếm (sắp có)"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto shrink-0">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#65676b] hover:bg-[#f0f2f5] transition-colors"
            aria-label="Thông báo"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </button>

          <div className="flex items-center gap-2 pl-1 border-l border-[#e4e6eb] ml-1">
            <UserAvatar user={user} className="w-10 h-10 text-base" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1c1e21] truncate max-w-[140px]">{displayName}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-1 px-3 py-2 text-sm font-semibold rounded-full text-[#65676b] hover:bg-[#f0f2f5] transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
