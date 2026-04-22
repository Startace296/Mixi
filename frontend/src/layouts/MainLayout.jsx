import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import HomeHeader from '../components/home-comp/HomeHeader';
import HomeSidebarPrimary from '../components/home-comp/HomeSidebarPrimary';
import HomeSidebarSecondary from '../components/home-comp/HomeSidebarSecondary';
import { HOME_SECTION, DEFAULT_SUB_SECTION } from '../components/home-comp/homeSections';
import { useStoredUser } from '../hooks/useStoredUser';
import { getMyProfile } from '../services/api.js';

export default function MainLayout() {
  const [user, setUser] = useStoredUser();
  const [activeSection, setActiveSection] = useState(HOME_SECTION.home);
  const [activeSubSection, setActiveSubSection] = useState(DEFAULT_SUB_SECTION[HOME_SECTION.home]);

  useEffect(() => {
    let mounted = true;

    async function loadUserProfile() {
      if (!localStorage.getItem('token')) return;

      try {
        const data = await getMyProfile();
        if (!mounted || !data?.user) return;

        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {
        // ignore profile sync failures here; axios will clear auth on 401
      }
    }

    loadUserProfile();

    return () => {
      mounted = false;
    };
  }, [setUser]);

  function handleSelectSection(section) {
    setActiveSection(section);
    setActiveSubSection(DEFAULT_SUB_SECTION[section]);
  }

  const isProfilePage = activeSection === HOME_SECTION.profile;

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden">
      <HomeHeader user={user} onSelectSection={handleSelectSection} />
      <div className="flex flex-1 pt-16 min-h-0">
        {!isProfilePage && (
          <div className="flex shrink-0 h-full overflow-visible">
            <HomeSidebarPrimary activeSection={activeSection} onSelectSection={handleSelectSection} />
            <HomeSidebarSecondary
              activeSection={activeSection}
              activeSubSection={activeSubSection}
              onSelectSubSection={setActiveSubSection}
            />
          </div>
        )}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet context={{ activeSection, activeSubSection, user, setUser }} />
        </main>
      </div>
    </div>
  );
}
