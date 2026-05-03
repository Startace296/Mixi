import { HOME_SECTION, HOME_SUB_SECTION } from './homeSections.js';

/**
 * Map current pathname to in-app section state (single source of truth with React Router).
 */
export function parseMainPath(pathname) {
  if (pathname === '/home') {
    return {
      section: HOME_SECTION.home,
      subSection: HOME_SUB_SECTION.home_feed,
      threadId: null,
      profileUserId: null,
    };
  }

  if (pathname === '/friends/requests') {
    return {
      section: HOME_SECTION.friends,
      subSection: HOME_SUB_SECTION.friends_requests,
      threadId: null,
      profileUserId: null,
    };
  }

  if (pathname === '/friends/all') {
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

  if (pathname === '/messages') {
    return {
      section: HOME_SECTION.messages,
      subSection: null,
      threadId: null,
      profileUserId: null,
    };
  }

  if (pathname === '/profile') {
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

  if (pathname === '/settings/notifications') {
    return {
      section: HOME_SECTION.settings,
      subSection: HOME_SUB_SECTION.settings_notifications,
      threadId: null,
      profileUserId: null,
    };
  }

  if (pathname === '/settings/help') {
    return {
      section: HOME_SECTION.settings,
      subSection: HOME_SUB_SECTION.settings_help,
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
