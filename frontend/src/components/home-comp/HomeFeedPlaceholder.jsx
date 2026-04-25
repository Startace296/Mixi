import { HOME_SECTION } from '../../lib/homeSections.js';
import HomeSectionView from './HomeSectionView.jsx';
import FriendsSectionView from '../friend-comp/FriendsSectionView.jsx';
import ProfileSectionView from '../profile-comp/ProfileSectionView.jsx';
import SettingsSectionView from '../setting-comp/SettingsSectionView.jsx';
import ChatSectionView from '../chat-comp/ChatSectionView.jsx';

export default function HomeFeedPlaceholder({ user, displayName, section, subSection, onUserChange, onSelectSection }) {
  if (section === HOME_SECTION.home) {
    return <HomeSectionView displayName={displayName} user={user} onSelectSection={onSelectSection} />;
  }
  if (section === HOME_SECTION.messages) {
    return <ChatSectionView />;
  }
  if (section === HOME_SECTION.friends) {
    return <FriendsSectionView subSection={subSection} />;
  }
  if (section === HOME_SECTION.profile) {
    return <ProfileSectionView displayName={displayName} user={user} onUserChange={onUserChange} />;
  }
  if (section === HOME_SECTION.settings) {
    return <SettingsSectionView subSection={subSection} />;
  }
  return null;
}
