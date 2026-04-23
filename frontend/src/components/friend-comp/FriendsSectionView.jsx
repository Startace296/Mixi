import { useEffect, useMemo, useState } from 'react';

import { HOME_SUB_SECTION } from '../home-comp/homeSections';

const MOCK_INCOMING_REQUESTS = [
  { id: 'u1', displayName: 'Mai Linh' },
  { id: 'u3', displayName: 'Ngoc Linh' },
];

const MOCK_NOT_FRIEND_USERS = [
  { id: 'u2', displayName: 'Long Trần' },
  { id: 'u4', displayName: 'Bảo An' },
  { id: 'u5', displayName: 'Ngọc Linh' },
];

const MOCK_FRIENDS = [
  { id: 'f1', name: 'Quoc Huy' },
  { id: 'f2', name: 'Thu Trang' },
  { id: 'f3', name: 'Duc Anh' },
];

function normalizeSearchText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function matchesSearch(value, query) {
  if (!query) return true;
  const normalizedValue = normalizeSearchText(value);
  const paddedValue = ` ${normalizedValue} `;
  const paddedQuery = ` ${query} `;
  return paddedValue.includes(paddedQuery);
}

function SectionDivider({ title, count }) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <h2 className="text-base font-bold text-[#1c1e21]">{title}</h2>
      {count != null && <span className="text-xs font-medium text-[#8a8d91]">{count} people</span>}
    </div>
  );
}

function FriendRequestCard({ displayName }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#e4e6eb] bg-white p-4 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700">
          {displayName[0]}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1c1e21]">{displayName}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="flex-1 rounded-full bg-indigo-600 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
          Accept
        </button>
        <button type="button" className="flex-1 rounded-full border border-[#e4e6eb] py-1.5 text-sm font-semibold text-[#65676b] transition-colors hover:bg-[#f0f2f5]">
          Decline
        </button>
      </div>
    </div>
  );
}

function UserSearchCard({ displayName }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e4e6eb] bg-white p-4 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700">
        {displayName[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1c1e21]">{displayName}</p>
      </div>
      <button type="button" className="shrink-0 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
        Add friend
      </button>
    </div>
  );
}

function FriendCard({ name }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e4e6eb] bg-white p-4 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700">
        {name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1c1e21]">{name}</p>
      </div>
      <button type="button" className="shrink-0 rounded-full border border-[#e4e6eb] px-4 py-1.5 text-sm font-semibold text-[#65676b] transition-colors hover:bg-[#f0f2f5]">
        Message
      </button>
    </div>
  );
}

export default function FriendsSectionView({ subSection }) {
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const normalized = normalizeSearchText(submittedSearch);

  const filteredIncomingRequests = useMemo(() => {
    if (!normalized) return MOCK_INCOMING_REQUESTS;
    return MOCK_INCOMING_REQUESTS.filter((user) =>
      matchesSearch(user.displayName, normalized)
    );
  }, [normalized]);

  const filteredSearchUsers = useMemo(() => {
    if (!normalized) return [];
    return MOCK_NOT_FRIEND_USERS.filter((user) =>
      matchesSearch(user.displayName, normalized)
    );
  }, [normalized]);

  const filteredFriends = useMemo(() => {
    if (!normalized) return MOCK_FRIENDS;
    return MOCK_FRIENDS.filter((friend) => matchesSearch(friend.name, normalized));
  }, [normalized]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSubmittedSearch(searchText.trim());
    }
  };

  useEffect(() => {
    setSearchText('');
    setSubmittedSearch('');
  }, [subSection]);

  if (subSection === HOME_SUB_SECTION.friends_all) {
    return (
      <div className="mx-auto w-full max-w-[900px] space-y-5 px-4 py-6">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8d91]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search friends..."
            className="w-full rounded-full border border-[#dddfe2] bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <SectionDivider title="All friends" count={filteredFriends.length} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFriends.map((friend) => <FriendCard key={friend.id} {...friend} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-5 px-4 py-6">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8d91]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Type full name and press Enter..."
          className="w-full rounded-full border border-[#dddfe2] bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-indigo-500"
        />
      </div>
      <SectionDivider title="Friend requests" count={filteredIncomingRequests.length} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredIncomingRequests.map((request) => <FriendRequestCard key={request.id} {...request} />)}
      </div>
      {normalized && filteredSearchUsers.length > 0 && (
        <>
          <SectionDivider title="Search users" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSearchUsers.map((user) => <UserSearchCard key={user.id} {...user} />)}
          </div>
        </>
      )}
    </div>
  );
}
