import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import HomeHeader from '../components/home-comp/HomeHeader';
import HomeSidebarPrimary from '../components/home-comp/HomeSidebarPrimary';
import HomeSidebarSecondary from '../components/home-comp/HomeSidebarSecondary';
import { HOME_SECTION } from '../components/home-comp/homeSections';
import { useStoredUser } from '../hooks/useStoredUser';

export default function MainLayout() {
  const user = useStoredUser();
  const [activeSection, setActiveSection] = useState(HOME_SECTION.home);

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5]">
      <HomeHeader user={user} />
      <div className="flex flex-1 pt-16 min-h-0 overflow-hidden">
        <div className="flex shrink-0 overflow-visible">
          <HomeSidebarPrimary activeSection={activeSection} onSelectSection={setActiveSection} />
          <HomeSidebarSecondary activeSection={activeSection} />
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Outlet context={{ activeSection }} />
        </div>
      </div>
    </div>
  );
}
