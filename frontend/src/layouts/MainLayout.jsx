import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import HomeHeader from '../components/home-comp/HomeHeader';
import HomeSidebarPrimary from '../components/home-comp/HomeSidebarPrimary';
import HomeSidebarSecondaryPanel from '../components/home-comp/HomeSidebarSecondaryPanel.jsx';
import ChatSidebarSecondaryPanel from '../components/chat-comp/ChatSidebarSecondaryPanel.jsx';
import FriendsSidebarSecondaryPanel from '../components/friend-comp/FriendsSidebarSecondaryPanel.jsx';
import SettingsSidebarSecondaryPanel from '../components/setting-comp/SettingsSidebarSecondaryPanel.jsx';
import { HOME_SECTION, DEFAULT_SUB_SECTION } from '../lib/homeSections.js';
import { MOCK_CHAT_THREADS } from '../lib/chatSidebarData.js';
import { useAuthUser } from '../hooks/useAuthUser';

export default function MainLayout() {
  const { authUser: user, setAuthUser: setUser } = useAuthUser();
  const [activeSection, setActiveSection] = useState(HOME_SECTION.home);
  const [activeSubSection, setActiveSubSection] = useState(DEFAULT_SUB_SECTION[HOME_SECTION.home]);
  const [selectedChatId, setSelectedChatId] = useState(MOCK_CHAT_THREADS[0]?.id ?? null);

  function handleSelectSection(section) {
    setActiveSection(section);
    setActiveSubSection(DEFAULT_SUB_SECTION[section]);
  }

  const isProfilePage = activeSection === HOME_SECTION.profile;
  const selectedChatThread = MOCK_CHAT_THREADS.find((thread) => thread.id === selectedChatId) || null;

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
                onSelectChat={(chat) => setSelectedChatId(chat.id)}
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
              user,
              setUser,
              onSelectSection: handleSelectSection,
            }}
          />
        </main>
      </div>
    </div>
  );
}
