import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import HomeHeader from '../components/home-comp/HomeHeader';
import HomeSidebarPrimary from '../components/home-comp/HomeSidebarPrimary';
import HomeSidebarSecondaryPanel from '../components/home-comp/HomeSidebarSecondaryPanel.jsx';
import ChatSidebarSecondaryPanel from '../components/chat-comp/ChatSidebarSecondaryPanel.jsx';
import FriendsSidebarSecondaryPanel from '../components/friend-comp/FriendsSidebarSecondaryPanel.jsx';
import SettingsSidebarSecondaryPanel from '../components/setting-comp/SettingsSidebarSecondaryPanel.jsx';
import { HOME_SECTION, HOME_SUB_SECTION } from '../lib/homeSections.js';
import { parseMainPath } from '../lib/appPaths.js';
import { createDirectConversation } from '../lib/api.js';
import { emitPresenceStatus, getAuthenticatedSocket } from '../lib/socket.js';
import { useAuthUser } from '../hooks/useAuthUser';

const AWAY_AFTER_MS = 60000;

export default function MainLayout() {
  const { authUser: user, setAuthUser: setUser } = useAuthUser();
  const navigate = useNavigate();
  const { pathname, state: locationState } = useLocation();
  const [selectedChatThread, setSelectedChatThread] = useState(null);

  const parsed = useMemo(() => parseMainPath(pathname), [pathname]);

  const lastChatIdRef = useRef(null);

  useEffect(() => {
    if (parsed.section === HOME_SECTION.messages && parsed.threadId) {
      lastChatIdRef.current = parsed.threadId;
    }
  }, [parsed.section, parsed.threadId]);

  const selectedChatId =
    parsed.section === HOME_SECTION.messages && parsed.threadId
      ? parsed.threadId
      : lastChatIdRef.current;

  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    let awayTimerId = null;
    let currentStatus = "";

    const setPresenceStatus = (status) => {
      if (currentStatus === status) return;
      currentStatus = status;
      emitPresenceStatus(status);
    };

    const scheduleAway = () => {
      window.clearTimeout(awayTimerId);
      awayTimerId = window.setTimeout(() => {
        setPresenceStatus("away");
      }, AWAY_AFTER_MS);
    };

    const markOnline = () => {
      if (document.visibilityState === "hidden") return;
      setPresenceStatus("online");
      scheduleAway();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        window.clearTimeout(awayTimerId);
        setPresenceStatus("away");
        return;
      }
      markOnline();
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markOnline, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    markOnline();

    return () => {
      window.clearTimeout(awayTimerId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markOnline);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id]);

  useEffect(() => {
    if (parsed.section !== HOME_SECTION.messages) {
      return;
    }
    if (!selectedChatId) {
      setSelectedChatThread(null);
      return;
    }
    if (selectedChatThread?.id !== selectedChatId) {
      setSelectedChatThread(null);
    }
  }, [parsed.section, selectedChatId, selectedChatThread?.id]);

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

  const handleSelectSection = useCallback((section) => {
    switch (section) {
      case HOME_SECTION.home:
        navigate('/home');
        break;
      case HOME_SECTION.friends:
        navigate('/friends/requests');
        break;
      case HOME_SECTION.messages: {
        const id = lastChatIdRef.current;
        navigate(id ? `/messages/${id}` : '/messages');
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
  }, [navigate]);

  const handleOpenProfile = useCallback((profile) => {
    if (!profile) {
      navigate('/profile', { state: {} });
      return;
    }
    if (profile.id != null && String(profile.id).length > 0) {
      navigate(`/profile/${encodeURIComponent(String(profile.id))}`, { state: {} });
      return;
    }
    navigate('/profile', { state: { viewedProfile: profile } });
  }, [navigate]);

  const handleSelectChat = useCallback((chat, shouldNavigate = true) => {
    if (!chat?.id) {
      setSelectedChatThread(null);
      if (shouldNavigate) {
        navigate('/messages');
      }
      return;
    }

    lastChatIdRef.current = chat.id;
    setSelectedChatThread((prevChat) => (prevChat?.id === chat.id ? { ...prevChat, ...chat } : chat));
    if (shouldNavigate) {
      navigate(`/messages/${chat.id}`);
    }
  }, [navigate]);

  const handleOpenChatWithFriend = useCallback(async (friend) => {
    const friendId = friend?.id ?? friend?.friendId ?? friend?.userId;
    if (!friendId) {
      toast.error('Cannot open chat for this user.');
      return;
    }

    try {
      const response = await createDirectConversation({ friendId: String(friendId) });
      const conversation = response?.conversation;
      if (!conversation?.id) {
        throw new Error('Conversation not available');
      }

      lastChatIdRef.current = conversation.id;
      setSelectedChatThread(conversation);
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to open conversation');
    }
  }, [navigate]);

  const handleSubSectionChange = useCallback((subKey) => {
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
  }, [activeSection, navigate]);

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
                currentUserId={user?.id}
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
