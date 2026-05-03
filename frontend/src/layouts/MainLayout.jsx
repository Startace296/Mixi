import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import HomeHeader from '../components/home-comp/HomeHeader';
import HomeSidebarPrimary from '../components/home-comp/HomeSidebarPrimary';
import HomeSidebarSecondaryPanel from '../components/home-comp/HomeSidebarSecondaryPanel.jsx';
import ChatSidebarSecondaryPanel from '../components/chat-comp/ChatSidebarSecondaryPanel.jsx';
import FriendsSidebarSecondaryPanel from '../components/friend-comp/FriendsSidebarSecondaryPanel.jsx';
import SettingsSidebarSecondaryPanel from '../components/setting-comp/SettingsSidebarSecondaryPanel.jsx';
import { HOME_SECTION, DEFAULT_SUB_SECTION } from '../lib/homeSections.js';
import { useAuthUser } from '../hooks/useAuthUser';

export default function MainLayout() {
  const { authUser: user, setAuthUser: setUser } = useAuthUser();
  const [activeSection, setActiveSection] = useState(HOME_SECTION.home);
  const [activeSubSection, setActiveSubSection] = useState(DEFAULT_SUB_SECTION[HOME_SECTION.home]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChatThread, setSelectedChatThread] = useState(null);
  const [viewedProfile, setViewedProfile] = useState(null);

  function buildNavState(section, subSection, chatId, profile) {
    return {
      appNav: true,
      section,
      subSection,
      selectedChatId: chatId,
      viewedProfile: profile,
    };
  }

  function syncBrowserState(section, subSection, chatId, profile, mode = 'push') {
    const nextState = buildNavState(section, subSection, chatId, profile);
    if (mode === 'replace') {
      window.history.replaceState(nextState, '', window.location.href);
      return;
    }
    window.history.pushState(nextState, '', window.location.href);
  }

  function handleSelectSection(section, shouldPushState = true) {
    const nextSubSection = DEFAULT_SUB_SECTION[section];
    const nextProfile = null;

    setActiveSection(section);
    setActiveSubSection(nextSubSection);
    setViewedProfile(nextProfile);

    if (shouldPushState) {
      syncBrowserState(section, nextSubSection, selectedChatId, nextProfile);
    }
  }

  function handleOpenProfile(profile, shouldPushState = true) {
    setViewedProfile(profile || null);
    setActiveSection(HOME_SECTION.profile);
    setActiveSubSection(DEFAULT_SUB_SECTION[HOME_SECTION.profile]);

    if (shouldPushState) {
      syncBrowserState(
        HOME_SECTION.profile,
        DEFAULT_SUB_SECTION[HOME_SECTION.profile],
        selectedChatId,
        profile || null
      );
    }
  }

  function handleSelectChat(chat, shouldPushState = true) {
    const nextChatId = chat?.id || null;
    setSelectedChatId(nextChatId);
    setSelectedChatThread(chat || null);

    if (shouldPushState) {
      syncBrowserState(activeSection, activeSubSection, nextChatId, viewedProfile);
    }
  }

  const isProfilePage = activeSection === HOME_SECTION.profile;

  useEffect(() => {
    syncBrowserState(activeSection, activeSubSection, selectedChatId, viewedProfile, 'replace');
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (!state?.appNav) return;

      setActiveSection(state.section || HOME_SECTION.home);
      setActiveSubSection(state.subSection ?? DEFAULT_SUB_SECTION[state.section || HOME_SECTION.home]);
      setSelectedChatId(state.selectedChatId ?? null);
      setViewedProfile(state.viewedProfile || null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
                onSelectSubSection={setActiveSubSection}
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
                onSelectSubSection={setActiveSubSection}
              />
            )}
            {activeSection === HOME_SECTION.settings && (
              <SettingsSidebarSecondaryPanel
                activeSubSection={activeSubSection}
                onSelectSubSection={setActiveSubSection}
              />
            )}
          </div>
        )}
        <main className="flex-1 min-w-0 overflow-y-auto">
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
            }}
          />
        </main>
      </div>
    </div>
  );
}
