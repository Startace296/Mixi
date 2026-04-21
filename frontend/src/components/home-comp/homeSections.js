/** Primary nav sections (icon sidebar) */
export const HOME_SECTION = {
  home: 'home',
  messages: 'messages',
  friends: 'friends',
  profile: 'profile',
  settings: 'settings',
};

export const HOME_SECTION_LABELS = {
  [HOME_SECTION.home]: 'Trang chủ',
  [HOME_SECTION.messages]: 'Tin nhắn',
  [HOME_SECTION.friends]: 'Bạn bè',
  [HOME_SECTION.profile]: 'Hồ sơ',
  [HOME_SECTION.settings]: 'Cài đặt',
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
  profile_posts: 'profile_posts',

  // Settings
  settings_notifications: 'settings_notifications',
  settings_help:          'settings_help',
};

/** Default sub-section when switching to a primary section */
export const DEFAULT_SUB_SECTION = {
  [HOME_SECTION.home]:     HOME_SUB_SECTION.home_feed,
  [HOME_SECTION.messages]: null,
  [HOME_SECTION.friends]:  HOME_SUB_SECTION.friends_requests,
  [HOME_SECTION.profile]:  HOME_SUB_SECTION.profile_info,
  [HOME_SECTION.settings]: HOME_SUB_SECTION.settings_notifications,
};

