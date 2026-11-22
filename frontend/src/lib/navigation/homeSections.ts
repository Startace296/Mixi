/** Primary nav sections (icon sidebar) */
export const HOME_SECTION = {
  home: 'home',
  messages: 'messages',
  friends: 'friends',
  profile: 'profile',
  settings: 'settings',
} as const;

export type HomeSection = (typeof HOME_SECTION)[keyof typeof HOME_SECTION];

export const HOME_SECTION_LABELS: Record<HomeSection, string> = {
  [HOME_SECTION.home]: 'Home',
  [HOME_SECTION.messages]: 'Messages',
  [HOME_SECTION.friends]: 'Friends',
  [HOME_SECTION.profile]: 'Profile',
  [HOME_SECTION.settings]: 'Settings',
};

/** Secondary nav sub-sections (secondary sidebar buttons) */
export const HOME_SUB_SECTION = {
  // Home
  home_feed: 'home_feed',

  // Friends
  friends_requests: 'friends_requests',
  friends_all:      'friends_all',

  // Profile
  profile_info:  'profile_info',

  // Settings
  settings_change_password: 'settings_change_password',
} as const;

export type HomeSubSection = (typeof HOME_SUB_SECTION)[keyof typeof HOME_SUB_SECTION];

/** Default sub-section when switching to a primary section */
export const DEFAULT_SUB_SECTION: Record<HomeSection, HomeSubSection | null> = {
  [HOME_SECTION.home]:     HOME_SUB_SECTION.home_feed,
  [HOME_SECTION.messages]: null,
  [HOME_SECTION.friends]:  HOME_SUB_SECTION.friends_requests,
  [HOME_SECTION.profile]:  HOME_SUB_SECTION.profile_info,
  [HOME_SECTION.settings]: HOME_SUB_SECTION.settings_change_password,
};

