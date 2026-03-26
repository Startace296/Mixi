import { useNavigate, useLocation } from 'react-router-dom';

function BrandMark({ size = 'md' }) {
  const iconClass =
    size === 'lg'
      ? 'w-[72px] h-[72px] md:w-[76px] md:h-[76px]'
      : 'w-11 h-11';
  const textClass = size === 'lg' ? 'text-[28px] md:text-[34px]' : 'text-xl';

  return (
    <div className="flex items-center gap-1">
      <img
        src="/MixiChatLogo.png"
        alt="MixiChat"
        className={`${iconClass} object-contain`}
        draggable={false}
      />
      <span
        className={`${textClass} font-semibold text-[#2563eb] tracking-tight leading-[1] -ml-1`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Mixi
      </span>
    </div>
  );
}

export function Logo() {
  return (
    <div className="absolute top-8 left-8 z-10">
      <BrandMark size="lg" />
    </div>
  );
}

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'About us', path: '/about' },
    { label: 'Policies', path: '/policies' },
    { label: 'Helps', path: '/help' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex items-center justify-between px-6">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate('/login')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/login')}
        role="button"
        tabIndex={0}
      >
        <BrandMark size="md" />
      </div>

      <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-end">
        {navLinks.map((link) => (
          <button
            key={link.path}
            type="button"
            className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
              location.pathname === link.path
                ? 'text-indigo-600'
                : 'text-[#606770]'
            }`}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </button>
        ))}
        <button
          type="button"
          className="px-4 py-2 text-sm font-semibold rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          onClick={() => navigate('/signup')}
        >
          Sign up
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-semibold rounded-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600/10 transition-colors"
          onClick={() => navigate('/login')}
        >
          Log in
        </button>
      </div>
    </nav>
  );
}

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="w-full h-[120px] min-h-[120px] max-h-[120px] py-3 pt-3 pb-2 flex-shrink-0 box-border flex flex-col justify-between">
      <div className="h-px bg-[#b0b5bb] mb-2.5 w-full" />
      <div className="grid grid-cols-5 text-sm justify-items-center text-[#606770]">
        <span />
        <span
          className="cursor-pointer hover:underline"
          onClick={() => navigate('/about')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/about')}
          role="button"
          tabIndex={0}
        >
          About us
        </span>
        <span
          className="cursor-pointer hover:underline"
          onClick={() => navigate('/policies')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/policies')}
          role="button"
          tabIndex={0}
        >
          Policies
        </span>
        <span
          className="cursor-pointer hover:underline"
          onClick={() => navigate('/help')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/help')}
          role="button"
          tabIndex={0}
        >
          Helps
        </span>
        <span />
      </div>
      <p className="text-center text-xs text-gray-400">
        © 2026 ChatApp. All rights reserved.
      </p>
    </footer>
  );
}
