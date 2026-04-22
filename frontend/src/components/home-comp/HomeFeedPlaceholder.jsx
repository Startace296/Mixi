import { useState, useRef } from 'react';
import { HOME_SECTION, HOME_SUB_SECTION } from './homeSections';

// ─── Shared primitives ───────────────────────────────────────────────────────

function SkeletonLine({ className = '' }) {
  return <div className={`rounded-md bg-[#e4e6eb] animate-pulse ${className}`} />;
}

function PostSkeleton() {
  return (
    <article className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <SkeletonLine className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-3.5 w-32" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      </div>
      <SkeletonLine className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-4/5" />
      </div>
    </article>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] py-16 px-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-400">
        {icon}
      </div>
      <p className="text-base font-semibold text-[#1c1e21]">{title}</p>
      {description && <p className="mt-1 text-sm text-[#65676b]">{description}</p>}
    </div>
  );
}

function FeedShell({ title, description, children }) {
  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-4">
      <div className="rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] bg-white px-5 py-4">
        <h1 className="text-xl font-bold text-[#1c1e21]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#65676b]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionDivider({ title, count }) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <h2 className="text-base font-bold text-[#1c1e21]">{title}</h2>
      {count != null && <span className="text-xs font-medium text-[#8a8d91]">{count} người</span>}
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REQUESTS = [
  { id: 'r1', name: 'Mai Linh', mutual: '3 bạn chung' },
  { id: 'r2', name: 'Hữu Phước', mutual: 'Gợi ý cho bạn' },
];

const MOCK_FRIENDS = [
  { id: 'f1', name: 'Quốc Huy', mutual: '12 bạn chung' },
  { id: 'f2', name: 'Thu Trang', mutual: '5 bạn chung' },
  { id: 'f3', name: 'Đức Anh', mutual: '1 bạn chung' },
];

// ─── Friend cards ─────────────────────────────────────────────────────────────

function FriendRequestCard({ name, mutual }) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-base">
          {name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1c1e21] truncate">{name}</p>
          <p className="text-xs text-[#65676b]">{mutual}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="flex-1 rounded-full bg-indigo-600 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
          Chấp nhận
        </button>
        <button type="button" className="flex-1 rounded-full border border-[#e4e6eb] py-1.5 text-sm font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors">
          Từ chối
        </button>
      </div>
    </div>
  );
}

function FriendCard({ name, mutual }) {
  return (
    <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-4 flex items-center gap-3">
      <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-base">
        {name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1c1e21] truncate">{name}</p>
        <p className="text-xs text-[#65676b]">{mutual}</p>
      </div>
      <button type="button" className="shrink-0 rounded-full border border-[#e4e6eb] px-4 py-1.5 text-sm font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors">
        Nhắn tin
      </button>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconChat = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5.454 21.11A.75.75 0 014 20.25v-4.568c0-1.121-.504-2.176-1.332-2.93C2.629 11.364 2.25 10.746 2.25 10c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);


const IconCog = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ─── Section renderers ────────────────────────────────────────────────────────

function HomeSection({ displayName }) {
  // home_feed
  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-4">
      <section className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-4">
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center shrink-0 text-sm">
            {(displayName && displayName[0]?.toUpperCase()) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="home-composer" className="sr-only">Tạo bài viết</label>
            <textarea
              id="home-composer"
              rows={2}
              readOnly
              placeholder={`${displayName} ơi, bạn đang nghĩ gì thế?`}
              className="w-full resize-none rounded-xl bg-[#f0f2f5] border border-[#e4e6eb] px-4 py-3 text-sm text-[#1c1e21] placeholder:text-[#8a8d91] outline-none cursor-default"
            />
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f0f2f5]">
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-[#65676b] bg-[#f0f2f5] hover:bg-[#e4e6eb] transition-colors cursor-default">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                Ảnh / Video
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-[#65676b] bg-[#f0f2f5] hover:bg-[#e4e6eb] transition-colors cursor-default">
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                Cảm xúc
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-[#1c1e21]">Bảng tin</h2>
        <span className="text-xs font-medium text-[#8a8d91]">Sắp kết nối API</span>
      </div>
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}

function FriendsSection({ subSection }) {
  if (subSection === HOME_SUB_SECTION.friends_all) {
    return (
      <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-5">
        <SectionDivider title="Tất cả bạn bè" count={MOCK_FRIENDS.length} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_FRIENDS.map((f) => <FriendCard key={f.id} {...f} />)}
        </div>
      </div>
    );
  }

  // friends_requests (default)
  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-5">
      <SectionDivider title="Lời mời kết bạn" count={MOCK_REQUESTS.length} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_REQUESTS.map((r) => <FriendRequestCard key={r.id} {...r} />)}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function EditProfileModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5]">
          <h2 className="text-lg font-bold text-[#1c1e21]">Edit profile</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] text-[#65676b] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Display name', type: 'input', defaultValue: user?.displayName || '', placeholder: '' },
            { label: 'Bio', type: 'textarea', defaultValue: user?.bio || '', placeholder: 'Write something about yourself...' },
            { label: 'Location', type: 'input', defaultValue: user?.location || '', placeholder: 'Your city or country' },
          ].map(({ label, type, defaultValue, placeholder }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#65676b] uppercase tracking-wide">{label}</label>
              {type === 'textarea' ? (
                <textarea rows={3} defaultValue={defaultValue} placeholder={placeholder}
                  className="px-4 py-2.5 rounded-lg border border-[#dddfe2] text-sm text-[#1c1e21] outline-none focus:border-indigo-500 transition-colors resize-none" />
              ) : (
                <input type="text" defaultValue={defaultValue} placeholder={placeholder}
                  className="px-4 py-2.5 rounded-lg border border-[#dddfe2] text-sm text-[#1c1e21] outline-none focus:border-indigo-500 transition-colors" />
              )}
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#65676b] uppercase tracking-wide">Date of birth</label>
            <input type="date" defaultValue={user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : ''}
              className="px-4 py-2.5 rounded-lg border border-[#dddfe2] text-sm text-[#1c1e21] outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#65676b] uppercase tracking-wide">Gender</label>
            <select defaultValue={user?.gender || ''} className="px-4 py-2.5 rounded-lg border border-[#dddfe2] text-sm text-[#1c1e21] outline-none focus:border-indigo-500 transition-colors bg-white">
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#f0f2f5]">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors">Cancel</button>
          <button type="button" className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Save changes</button>
        </div>
      </div>
    </div>
  );
}

function AvatarModal({ onClose }) {
  const fileRef = useRef(null);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5]">
          <h2 className="text-lg font-bold text-[#1c1e21]">Choose profile picture</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] text-[#65676b] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-8 flex justify-center">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload photo
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ displayName, user }) {
  const [editOpen, setEditOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 py-6 space-y-4">

      {/* Avatar + name card */}
      <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <button type="button" onClick={() => setAvatarMenuOpen((p) => !p)} className="block rounded-full focus:outline-none">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-35 h-35 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 font-bold text-3xl flex items-center justify-center uppercase">
                  {displayName?.[0] || '?'}
                </div>
              )}
            </button>
            {avatarMenuOpen && (
              <>
                <div className="fixed inset-0 z-[9]" onClick={() => setAvatarMenuOpen(false)} />
                <button type="button"
                  onClick={() => { setAvatarMenuOpen(false); setAvatarModalOpen(true); }}
                  className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-lg bg-white text-[#1c1e21] text-sm font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-[#e4e6eb] hover:bg-[#f0f2f5] transition-colors z-10">
                  Choose profile picture
                </button>
              </>
            )}
          </div>
          <div className="pl-2">
            <h1 className="text-2xl font-bold text-[#1c1e21]">{displayName}</h1>
            <p className="text-sm text-[#65676b] mt-0.5">{user?.bio || 'No bio yet'}</p>
            <p className="text-sm text-[#8a8d91] mt-1">0 friend(s)</p>
          </div>
        </div>
        <button type="button" onClick={() => setEditOpen(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e4e6eb] text-sm font-semibold text-[#65676b] hover:bg-[#f0f2f5] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          Edit profile
        </button>
      </div>

      {/* About card */}
      <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.06)] border border-[#e4e6eb] p-5">
        <h2 className="text-base font-bold text-[#1c1e21] mb-4">About</h2>
        <div className="space-y-3">
          {[
            { icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636', label: user?.gender || '—' },
            { icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', label: formatDate(user?.dateOfBirth) },
            { icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', label: user?.location || 'None' },
          ].map(({ icon, label }, i) => (
            <div key={i} className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#65676b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              <span className="text-sm text-[#1c1e21]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <PostSkeleton />

      {editOpen && <EditProfileModal user={user} onClose={() => setEditOpen(false)} />}
      {avatarModalOpen && <AvatarModal onClose={() => setAvatarModalOpen(false)} />}

    </div>
  );
}

function SettingsSection({ subSection }) {
  const map = {
    [HOME_SUB_SECTION.settings_notifications]: { title: 'Thông báo', desc: 'Quản lý thông báo đẩy và email.' },
    [HOME_SUB_SECTION.settings_help]:          { title: 'Trợ giúp',  desc: 'Câu hỏi thường gặp và liên hệ hỗ trợ.' },
  };
  const { title, desc } = map[subSection] || map[HOME_SUB_SECTION.settings_notifications];
  return (
    <FeedShell title={title} description={desc}>
      <EmptyState icon={IconCog}
        title="Chưa có tùy chọn nào"
        description="Tính năng này sẽ sớm ra mắt."
      />
    </FeedShell>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function HomeFeedPlaceholder({ user, displayName, section, subSection }) {
  if (section === HOME_SECTION.home) {
    return <HomeSection displayName={displayName} />;
  }
  if (section === HOME_SECTION.messages) {
    return (
      <FeedShell title="Tin nhắn" description="Chọn một cuộc trò chuyện ở cột bên cạnh để mở tại đây.">
        <EmptyState icon={IconChat}
          title="Chưa có cuộc trò chuyện nào được chọn"
          description="Chọn một tin nhắn từ danh sách bên trái để xem."
        />
      </FeedShell>
    );
  }
  if (section === HOME_SECTION.friends) {
    return <FriendsSection subSection={subSection} />;
  }
  if (section === HOME_SECTION.profile) {
    return <ProfileSection displayName={displayName} user={user} />;
  }
  if (section === HOME_SECTION.settings) {
    return <SettingsSection subSection={subSection} />;
  }
  return null;
}
