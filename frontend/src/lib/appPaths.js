import { HOME_SECTION, HOME_SUB_SECTION } from './homeSections.js';

export const APP_PATHS = {
  home: '/home',
  friends: '/friends',
  friendsRequests: '/friends/requests',
  friendsAll: '/friends/all',
  messages: '/messages',
  profile: '/profile',
  settings: '/settings',
  settingsAccount: '/settings/account',
  login: '/login',
  signUp: '/signup',
  register: '/register',
  authCallback: '/auth/callback',
  authCallbackGoogle: '/auth/callback/google',
};

/**
 * Map current pathname to in-app section state (single source of truth with React Router).
 */
export function parseMainPath(pathname) {
  if (pathname === APP_PATHS.home) {
    return {
      section: HOME_SECTION.home,
      subSection: HOME_SUB_SECTION.home_feed,
      threadId: null,
      profileUserId: null,
    };
  }

  if (pathname === APP_PATHS.friendsRequests) {
    return {
      section: HOME_SECTION.friends,
      subSection: HOME_SUB_SECTION.friends_requests,
      threadId: null,
      profileUserId: null,
    };
  }

  if (pathname === APP_PATHS.friendsAll) {
    return {
      section: HOME_SECTION.friends,
      subSection: HOME_SUB_SECTION.friends_all,
      threadId: null,
      profileUserId: null,
    };
  }

  const messagesMatch = pathname.match(/^\/messages\/([^/]+)$/);
  if (messagesMatch) {
    return {
      section: HOME_SECTION.messages,
      subSection: null,
      threadId: messagesMatch[1],
      profileUserId: null,
    };
  }

  if (pathname === APP_PATHS.messages) {
    return {
      section: HOME_SECTION.messages,
      subSection: null,
      threadId: null,
      profileUserId: null,
    };
  }

  if (pathname === APP_PATHS.profile) {
    return {
      section: HOME_SECTION.profile,
      subSection: HOME_SUB_SECTION.profile_info,
      threadId: null,
      profileUserId: null,
    };
  }

  const profileMatch = pathname.match(/^\/profile\/([^/]+)$/);
  if (profileMatch) {
    return {
      section: HOME_SECTION.profile,
      subSection: HOME_SUB_SECTION.profile_info,
      threadId: null,
      profileUserId: decodeURIComponent(profileMatch[1]),
    };
  }

  if (pathname === APP_PATHS.settingsAccount) {
    return {
      section: HOME_SECTION.settings,
      subSection: HOME_SUB_SECTION.settings_change_password,
      threadId: null,
      profileUserId: null,
    };
  }

  return {
    section: HOME_SECTION.home,
    subSection: HOME_SUB_SECTION.home_feed,
    threadId: null,
    profileUserId: null,
  };
}
