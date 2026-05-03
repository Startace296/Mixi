import { useEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import HomeHeader from '../components/home-comp/HomeHeader';
import HomeSidebarPrimary from '../components/home-comp/HomeSidebarPrimary';
import HomeSidebarSecondaryPanel from '../components/home-comp/HomeSidebarSecondaryPanel.jsx';
import ChatSidebarSecondaryPanel from '../components/chat-comp/ChatSidebarSecondaryPanel.jsx';
import FriendsSidebarSecondaryPanel from '../components/friend-comp/FriendsSidebarSecondaryPanel.jsx';
import SettingsSidebarSecondaryPanel from '../components/setting-comp/SettingsSidebarSecondaryPanel.jsx';
import { HOME_SECTION, HOME_SUB_SECTION } from '../lib/homeSections.js';
import { parseMainPath } from '../lib/appPaths.js';
import {
  MOCK_CHAT_THREADS,
  MOCK_RECENT_CHATS,
  getDefaultChatThreadId,
} from '../lib/chatSidebarData.js';
import { useAuthUser } from '../hooks/useAuthUser';

export default function MainLayout() {
  const { authUser: user, setAuthUser: setUser } = useAuthUser();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();

  const parsed = useMemo(() => parseMainPath(pathname), [pathname]);

  const lastChatIdRef = useRef(getDefaultChatThreadId());

  useEffect(() => {
    if (parsed.section === HOME_SECTION.messages && parsed.threadId) {
      lastChatIdRef.current = parsed.threadId;
    }
  }, [parsed.section, parsed.threadId]);

  const selectedChatId =
    parsed.section === HOME_SECTION.messages && parsed.threadId
      ? parsed.threadId
      : lastChatIdRef.current;

  const selectedChatThread = useMemo(
    () => MOCK_CHAT_THREADS.find((thread) => thread.id === selectedChatId) || null,
    [selectedChatId]
  );

  const viewedProfile = useMemo(() => {
    if (parsed.section !== HOME_SECTION.profile) {
      return null;
    }
    if (parsed.profileUserId) {
      return { id: parsed.profileUserId };
    }
    return locationState?.viewedProfile ?? null;
  }, [parsed.section, parsed.profileUserId, locationState?.viewedProfile]);

  const activeSection = parsed.section;
  const activeSubSection = parsed.subSection;

  function handleSelectSection(section) {
    const defaultChat = getDefaultChatThreadId();
    switch (section) {
      case HOME_SECTION.home:
        navigate('/home');
        break;
      case HOME_SECTION.friends:
        navigate('/friends/requests');
        break;
      case HOME_SECTION.messages: {
        const id = lastChatIdRef.current || defaultChat;
        navigate(`/messages/${id}`);
        break;
      }
      case HOME_SECTION.profile:
        navigate('/profile', { state: {} });
        break;
      case HOME_SECTION.settings:
        navigate('/settings/notifications');
        break;
      default:
        navigate('/home');
    }
  }

  function handleOpenProfile(profile) {
    if (!profile) {
      navigate('/profile', { state: {} });
      return;
    }
    if (profile.id != null && String(profile.id).length > 0) {
      navigate(`/profile/${encodeURIComponent(String(profile.id))}`, { state: {} });
      return;
    }
    navigate('/profile', { state: { viewedProfile: profile } });
  }

  function handleSelectChat(chat) {
    lastChatIdRef.current = chat.id;
    navigate(`/messages/${chat.id}`);
  }

  function handleOpenChatWithFriend(friend) {
    const name = (friend?.displayName || '').trim().toLowerCase();
    const match = MOCK_CHAT_THREADS.find(
      (t) => t.type === 'direct' && (t.name || '').trim().toLowerCase() === name
    );
    const nextChatId = match?.id ?? MOCK_RECENT_CHATS[0]?.id ?? getDefaultChatThreadId();
    lastChatIdRef.current = nextChatId;
    navigate(`/messages/${nextChatId}`);
  }

  function handleSubSectionChange(subKey) {
    if (activeSection === HOME_SECTION.home) {
      navigate('/home');
      return;
    }
    if (activeSection === HOME_SECTION.friends) {
      if (subKey === HOME_SUB_SECTION.friends_requests) {
        navigate('/friends/requests');
      } else if (subKey === HOME_SUB_SECTION.friends_all) {
        navigate('/friends/all');
      }
      return;
    }
    if (activeSection === HOME_SECTION.settings) {
      if (subKey === HOME_SUB_SECTION.settings_notifications) {
        navigate('/settings/notifications');
      } else if (subKey === HOME_SUB_SECTION.settings_help) {
        navigate('/settings/help');
      }
    }
  }

  const isProfilePage = activeSection === HOME_SECTION.profile;

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden">
      <HomeHeader user={user} onSelectSection={handleSelectSection} />
      <div className="flex flex-1 pt-16 min-h-0">
        {!isProfilePage && (
          <div className="flex shrink-0 h-full overflow-visible">
            <HomeSidebarPrimary activeSection={activeSection} onSelectSection={handleSelectSection} />
            {activeSection === HOME_SECTION.home && (
              <HomeSidebarSecondaryPanel
                activeSubSection={activeSubSection}
                onSelectSubSection={handleSubSectionChange}
              />
            )}
            {activeSection === HOME_SECTION.messages && (
              <ChatSidebarSecondaryPanel
                selectedChatId={selectedChatId}
                onSelectChat={handleSelectChat}
              />
            )}
            {activeSection === HOME_SECTION.friends && (
              <FriendsSidebarSecondaryPanel
                activeSubSection={activeSubSection}
                onSelectSubSection={handleSubSectionChange}
              />
            )}
            {activeSection === HOME_SECTION.settings && (
              <SettingsSidebarSecondaryPanel
                activeSubSection={activeSubSection}
                onSelectSubSection={handleSubSectionChange}
              />
            )}
          </div>
        )}
        <main className="flex min-h-0 flex-1 min-w-0 flex-col overflow-y-auto">
          <Outlet
            context={{
              activeSection,
              activeSubSection,
              selectedChatThread,
              viewedProfile,
              user,
              setUser,
              onOpenProfile: handleOpenProfile,
              onSelectSection: handleSelectSection,
              onOpenChatWithFriend: handleOpenChatWithFriend,
            }}
          />
        </main>
      </div>
    </div>
  );
}
